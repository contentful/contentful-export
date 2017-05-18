import createClients from 'contentful-batch-libs/dist/utils/create-clients'
import dumpErrorBuffer from './dump-error-buffer'
import downloadAsset from './download-asset'
import fs from 'fs'
import getFullSourceSpace from 'contentful-batch-libs/dist/get/get-full-source-space'
import Promise from 'bluebird'
import log from 'npmlog'
import Listr from 'listr'
import UpdateRenderer from 'listr-update-renderer'
import VerboseRenderer from 'listr-verbose-renderer'
import { startCase } from 'lodash'
import Table from 'cli-table2'
import moment from 'moment'
import bfj from 'bfj-node4'
import parseOptions from './parseOptions'

const summary = {}

function createListrOptions (options) {
  if (options.useVerboseRenderer) {
    return {
      renderer: VerboseRenderer
    }
  }
  return {
    renderer: UpdateRenderer,
    collapse: false
  }
}

export default function runContentfulExport (params) {
  summary.startTime = moment()

  const options = parseOptions(params)

  const listrOptions = createListrOptions(options)

  const tasks = new Listr([
    {
      title: 'Initialize clients',
      task: (ctx) => {
        ctx.clients = createClients(options)
      }
    },
    {
      title: 'Fetching data from space',
      task: (ctx) => {
        return getFullSourceSpace({
          managementClient: ctx.clients.source.management,
          spaceId: ctx.clients.source.spaceId,
          maxAllowedLimit: options.maxAllowedLimit,
          includeDrafts: options.includeDrafts,
          skipContentModel: options.skipContentModel,
          skipContent: options.skipContent,
          skipWebhooks: options.skipWebhooks,
          skipRoles: options.skipRoles,
          listrOptions
        })
      }
    },
    {
      title: 'Download assets',
      task: (ctx) => {
        let successCount = 0
        let warningCount = 0
        let errorCount = 0

        log.info('export', `Downloading ${ctx.data.assets.length} assets`)

        return Promise.map(ctx.data.assets, (asset) => {
          if (!asset.fields.file) {
            log.warn('-> asset has no file(s)', JSON.stringify(asset))
            warningCount++
            return
          }
          const locales = Object.keys(asset.fields.file)
          return Promise.mapSeries(locales, (locale) => {
            const url = asset.fields.file[locale].url || asset.fields.file[locale].upload
            return downloadAsset(url, options.exportDir)
            .then((downLoadedFile) => {
              log.info('export', '-> ' + downLoadedFile)
              successCount++
            })
            .catch((error) => {
              log.error('export', '-> error downloading ' + url + ' => ' + error.message)
              log.error('export', JSON.stringify(error, null, 2))
              errorCount++
            })
          })
        }, {
          concurrency: 6
        })
        .then(() => {
          ctx.assetDownloads = {
            successCount,
            warningCount,
            errorCount
          }
        })
      },
      skip: () => !options.downloadAssets
    },
    {
      title: 'Writing data to file',
      task: (ctx) => {
        fs.existsSync(options.exportDir) || fs.mkdirSync(options.exportDir)
        ctx.responseFile = `${options.exportDir}/contentful-export-${ctx.clients.source.spaceId}-${Date.now()}.json`
        return bfj.write(ctx.responseFile, ctx.data, {
          circular: 'ignore',
          space: 2
        })
      },
      skip: () => !options.saveFile
    }
  ], listrOptions)

  return tasks.run({
    data: {}
  })
  .then((ctx) => {
    const responseTable = new Table()

    responseTable.push([{colSpan: 2, content: 'Exported entities'}])

    Object.keys(ctx.data).forEach((type) => {
      responseTable.push([startCase(type), ctx.data[type].length])
    })

    console.log(responseTable.toString())

    if ('assetDownloads' in summary) {
      const downloadsTable = new Table()
      downloadsTable.push([{colSpan: 2, content: 'Asset file download results'}])
      downloadsTable.push(['Successful', ctx.assetDownloads.successCount])
      downloadsTable.push(['Warnings ', ctx.assetDownloads.warningCount])
      downloadsTable.push(['Errors ', ctx.assetDownloads.errorCount])
      console.log(downloadsTable.toString())
    }

    const durationHuman = summary.startTime.fromNow(true)
    const durationSeconds = moment().diff(summary.startTime, 'seconds')

    log.info('export', `The export took ${durationHuman} (${durationSeconds}s)`)
    if (options.saveFile) {
      log.info('export', `Stored space data to json file at: ${ctx.responseFile}`)
    }
    return ctx.data
  })
  .catch((err) => {
    const { sourceSpace, errorLogFile } = options
    dumpErrorBuffer({
      sourceSpace,
      errorLogFile
    })
    throw err
  })
}
