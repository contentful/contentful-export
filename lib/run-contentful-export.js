import createClients from 'contentful-batch-libs/utils/create-clients'
import dumpErrorBuffer from './dump-error-buffer'
import downloadAsset from './download-asset'
import fs from 'fs'
import getFullSourceSpace from 'contentful-batch-libs/get/get-full-source-space'
import Promise from 'bluebird'
import jsonStringifySafe from 'json-stringify-safe'
var log = require('npmlog')

Promise.promisifyAll(fs)
export default function runContentfulExport (usageParams) {

  // Here both opts and errorLogFile are undefined
  // let {opts, errorLogFile} = usageParams
  // let opts = usageParams.opts, let errorLogFile = usageParams.errorLogFile
  // errorLogFile and opts are not set this way when runContentfulExport is called in bin
  let opts = usageParams;

  let exportToFile = true
  opts.sourceSpace = opts.sourceSpace || usageParams.spaceId;
  opts.sourceManagementToken = opts.sourceManagementToken || usageParams.managementToken;

  if (opts.exportDir === undefined) {
    let exportToFile = false
  }

  if (!opts) {
    exportToFile = false
    opts = {}
    opts.sourceSpace = opts.sourceSpace || usageParams.spaceId
    opts.sourceManagementToken = opts.sourceManagementToken || usageParams.managementToken
  }
  const clients = createClients(opts)
  return getFullSourceSpace({
    managementClient: clients.source.management,
    spaceId: clients.source.spaceId,
    maxAllowedLimit: opts.maxAllowedLimit,
    includeDrafts: opts.includeDrafts
  })
    .then((response) => {
      if (opts.downloadAssets) {
        var successCount = 0
        var warningCount = 0
        var errorCount = 0

        log.info('Downloading ' + response.assets.length + ' assets')

        var arrayOfDownloadPromises = []
        response.assets.forEach((asset) => {
          if (asset.fields.file) {
            Object.keys(asset.fields.file).forEach((key) => {
              arrayOfDownloadPromises.push(
                downloadAsset(asset.fields.file[key].url, opts.exportDir).then(
                  (downLoadedFile) => {
                    log.info('-> ' + downLoadedFile)
                    successCount++
                  })
                  .catch((error) => {
                    const {url} = asset.fields.file[key]
                    log.error('-> error downloading ' + url + ' => ' + error)
                    errorCount++
                    return Promise.resolve(url)
                  }
                )
              )
            })
          } else {
            log.warn('-> asset has no file(s)', jsonStringifySafe(asset))
            warningCount++
          }
        })

        Promise.all(arrayOfDownloadPromises).then(
          () => {
            log.info('All ' + response.assets.length + ' downloads finished')
            log.info('successes: ' + successCount)
            log.info('warnings: ' + warningCount)
            log.info('errors: ' + errorCount)
          }
        )
      }
      if (exportToFile) {
        fs.existsSync(opts.exportDir) || fs.mkdirSync(opts.exportDir)
        const responseFile = `${opts.exportDir}/contentful-export-${clients.source.spaceId}-${Date.now()}.json`
        log.info('Writing space data to json file at : ' + responseFile)
        return fs.writeFile(responseFile, jsonStringifySafe(response, null, 4))
      }
      return response
    })
    .catch((err) => {
      dumpErrorBuffer({
        sourceSpace: opts.sourceSpace,
        // errorLogFile is undefinied because 'errorLogFile = usageParams.errorLogFile' is undefined
        errorLogFile: errorLogFile
      })
      throw err
    })
}
