import createClients from 'contentful-batch-libs/dist/utils/create-clients'
import dumpErrorBuffer from './dump-error-buffer'
import downloadAsset from './download-asset'
import fs from 'fs'
import getFullSourceSpace from 'contentful-batch-libs/dist/get/get-full-source-space'
import Promise from 'bluebird'
import jsonStringifySafe from 'json-stringify-safe'
import log from 'npmlog'
import { resolve } from 'path'

export default function runContentfulExport (usageParams) {
  const defaultOpts = {
    exportDir: process.cwd(),
    includeDrafts: false,
    skipRoles: false,
    skipContentModel: false,
    skipContent: false,
    skipWebhooks: false,
    maxAllowedLimit: 1000,
    saveFile: true
  }

  const configFile = usageParams.config
    ? require(resolve(process.cwd(), usageParams.config))
    : {}

  const opts = {
    ...defaultOpts,
    ...configFile,
    ...usageParams
  }

  opts.sourceSpace = opts.sourceSpace || opts.spaceId
  opts.sourceManagementToken = opts.sourceManagementToken || opts.managementToken

  if (!opts.sourceSpace) {
    return Promise.reject(new Error('The `spaceId` option is required.'))
  }

  if (!opts.sourceManagementToken) {
    return Promise.reject(new Error('The `managementToken` option is required.'))
  }

  if (!opts.errorLogFile) {
    opts.errorLogFile = opts.exportDir + '/contentful-export-' + Date.now() + '.log'
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
      if (opts.saveFile) {
        fs.existsSync(opts.exportDir) || fs.mkdirSync(opts.exportDir)
        const responseFile = `${opts.exportDir}/contentful-export-${clients.source.spaceId}-${Date.now()}.json`
        log.info('Writing space data to json file at : ' + responseFile)
        fs.writeFileSync(responseFile, jsonStringifySafe(response, null, 4))
      }
      return response
    })
    .catch((err) => {
      const { sourceSpace, errorLogFile } = opts
      dumpErrorBuffer({
        sourceSpace,
        errorLogFile
      })
      throw err
    })
}
