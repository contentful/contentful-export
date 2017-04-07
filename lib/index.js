import createClients from 'contentful-batch-libs/dist/utils/create-clients'
import dumpErrorBuffer from './dump-error-buffer'
import downloadAsset from './download-asset'
import fs from 'fs'
import getFullSourceSpace from 'contentful-batch-libs/dist/get/get-full-source-space'
import Promise from 'bluebird'
import jsonStringifySafe from 'json-stringify-safe'
import log from 'npmlog'
import { resolve } from 'path'
import { startCase } from 'lodash'
import Table from 'cli-table2'
import moment from 'moment'

const summary = {}

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

  summary.startTime = moment()

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
      summary.assetDownloads = {
        successCount: 0,
        warningCount: 0,
        errorCount: 0
      }

      log.info('export', 'Downloading ' + response.assets.length + ' assets')

      return Promise.map(response.assets, (asset) => {
        if (!asset.fields.file) {
          log.warn('export', '-> asset has no file(s)', jsonStringifySafe(asset))
          summary.assetDownloads.warningCount++
          return
        }
        const locales = Object.keys(asset.fields.file)
        return Promise.mapSeries(locales, (locale) => {
          const url = asset.fields.file[locale].url || asset.fields.file[locale].upload
          if (!url) {
            log.warn('export', '-> asset no file(s) for locale', locale, jsonStringifySafe(asset))
            summary.assetDownloads.warningCount++
            return
          }
          return downloadAsset(url, opts.exportDir)
          .then((downLoadedFile) => {
            log.info('export', '-> ' + downLoadedFile)
            summary.assetDownloads.successCount++
          })
          .catch((error) => {
            log.error('export', '-> error downloading ' + url + ' => ' + error.message)
            log.error('export', JSON.stringify(error, null, 2))
            summary.assetDownloads.errorCount++
          })
        })
      }, {
        concurrency: 6
      })
      .then(() => {
        log.info('export', 'Finished loading files for ' + response.assets.length + ' assets.')
        return response
      })
    })
    .then((response) => {
      if (opts.saveFile) {
        fs.existsSync(opts.exportDir) || fs.mkdirSync(opts.exportDir)
        const responseFile = `${opts.exportDir}/contentful-export-${clients.source.spaceId}-${Date.now()}.json`
        log.info('export', 'Writing space data to json file at : ' + responseFile)
        fs.writeFileSync(responseFile, jsonStringifySafe(response, null, 4))
      }
      return response
    })
    .then((response) => {
      const responseTable = new Table()

      responseTable.push([{colSpan: 2, content: 'Exported entities'}])

      Object.keys(response).forEach((type) => {
        responseTable.push([startCase(type), response[type].length])
      })

      console.log(responseTable.toString())

      if ('assetDownloads' in summary) {
        const downloadsTable = new Table()
        downloadsTable.push([{colSpan: 2, content: 'Asset file download results'}])
        downloadsTable.push(['Successful', summary.assetDownloads.successCount])
        downloadsTable.push(['Warnings ', summary.assetDownloads.warningCount])
        downloadsTable.push(['Errors ', summary.assetDownloads.errorCount])
        console.log(downloadsTable.toString())
      }

      const durationHuman = summary.startTime.fromNow(true)
      const durationSeconds = moment().diff(summary.startTime, 'seconds')

      log.info('export', `The export took ${durationHuman} (${durationSeconds}s)`)

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
