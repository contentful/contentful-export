import createClients from 'contentful-batch-libs/dist/utils/create-clients'
import dumpErrorBuffer from './dump-error-buffer'
import downloadAsset from './download-asset'
import fs from 'fs'
import getFullSourceSpace from 'contentful-batch-libs/dist/get/get-full-source-space'
import Promise from 'bluebird'
import jsonStringifySafe from 'json-stringify-safe'
import log from 'npmlog'

export default function runContentfulExport (usageParams) {
  let {opts, errorLogFile} = usageParams
  let exportToFile = true
  if (!opts) {
    exportToFile = false
    opts = {}
    opts.sourceSpace = usageParams.spaceId
    opts.sourceManagementToken = usageParams.managementToken
  }
  const clients = createClients(opts)
  return getFullSourceSpace({
    managementClient: clients.source.management,
    spaceId: clients.source.spaceId,
    maxAllowedLimit: opts.maxAllowedLimit,
    includeDrafts: opts.includeDrafts,
    skipContentModel: opts.skipContentModel,
    skipContent: opts.skipContent,
    skipWebhooks: opts.skipWebhooks,
    skipRoles: opts.skipRoles
  })
    .then((response) => {
      if (!opts.downloadAssets) {
        return response
      }
      let successCount = 0
      let warningCount = 0
      let errorCount = 0

      log.info('Downloading ' + response.assets.length + ' assets')

      return Promise.map(response.assets, (asset) => {
        if (!asset.fields.file) {
          log.warn('-> asset has no file(s)', jsonStringifySafe(asset))
          warningCount++
          return
        }
        const locales = Object.keys(asset.fields.file)
        return Promise.mapSeries(locales, (locale) => {
          const url = asset.fields.file[locale].url || asset.fields.file[locale].upload
          return downloadAsset(url, opts.exportDir)
          .then((downLoadedFile) => {
            log.info('-> ' + downLoadedFile)
            successCount++
          })
          .catch((error) => {
            log.error('-> error downloading ' + url + ' => ' + error.message)
            log.error(JSON.stringify(error, null, 2))
            errorCount++
          })
        })
      }, {
        concurrency: 6
      })
      .then(() => {
        log.info('All ' + response.assets.length + ' assets downloaded.')
        log.info('Successful file downloads: ' + successCount)
        log.info('Download warnings: ' + warningCount)
        log.info('Download errors: ' + errorCount)
        return response
      })
    })
    .then((response) => {
      fs.existsSync(opts.exportDir) || fs.mkdirSync(opts.exportDir)
      const responseFile = `${opts.exportDir}/contentful-export-${clients.source.spaceId}-${Date.now()}.json`
      log.info('Writing space data to json file at : ' + responseFile)
      return fs.writeFileSync(responseFile, jsonStringifySafe(response, null, 4))
    })
    .catch((err) => {
      dumpErrorBuffer({
        sourceSpace: opts.sourceSpace,
        errorLogFile: errorLogFile
      })
      throw err
    })
}
