import { exists } from 'fs'

import bfj from 'bfj-node4'
import Promise from 'bluebird'
import Table from 'cli-table2'
import figures from 'figures'
import Listr from 'listr'
import UpdateRenderer from 'listr-update-renderer'
import VerboseRenderer from 'listr-verbose-renderer'
import { startCase } from 'lodash'
import mkdirp from 'mkdirp'
import moment from 'moment'

import getFullSourceSpace from 'contentful-batch-libs/dist/get/get-full-source-space'
import createClients from 'contentful-batch-libs/dist/utils/create-clients'
import getEntityName from 'contentful-batch-libs/dist/utils/get-entity-name'
import {
  setupErrorLogging,
  displayErrorLog,
  writeLogFile
} from 'contentful-batch-libs/dist/utils/logging'

import downloadAsset from './download-asset'

import parseOptions from './parseOptions'

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
  const summary = {
    startTime: moment()
  }
  const errorLog = []
  const timestamp = summary.startTime.format('YYYY-MM-DDTHH-mm-SS')

  const options = parseOptions(params)

  const logFilePath = `${options.exportDir}/contentful-export-${options.spaceId}-${timestamp}.json`
  const errorLogFilePath = `${options.exportDir}/contentful-export-error-log-${options.spaceId}-${timestamp}.json`

  const listrOptions = createListrOptions(options)

  // Setup custom error listener to store errors for later
  setupErrorLogging(errorLog)

  const tasks = new Listr([
    {
      title: 'Initialize clients',
      task: (ctx) => {
        ctx.clients = createClients(options)
      }
    },
    {
      title: 'Fetching data from space',
      task: (ctx, task) => {
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
      task: (ctx, task) => {
        let successCount = 0
        let warningCount = 0
        let errorCount = 0

        return Promise.map(ctx.data.assets, (asset) => {
          if (!asset.fields.file) {
            task.output = `${figures.warning} asset ${getEntityName(asset)} has no file(s)`
            warningCount++
            return
          }
          const locales = Object.keys(asset.fields.file)
          return Promise.mapSeries(locales, (locale) => {
            const url = asset.fields.file[locale].url || asset.fields.file[locale].upload
            return downloadAsset(url, options.exportDir)
            .then((downLoadedFile) => {
              task.output = `${figures.tick} downloaded ${getEntityName(downLoadedFile)} (${url})`
              successCount++
            })
            .catch((error) => {
              task.output = `${figures.cross} error downloading ${url}: ${error.message}`
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
      skip: (ctx) => !options.downloadAssets || !ctx.data.hasOwnProperty('assets')
    },
    {
      title: 'Write export log file',
      task: (ctx) => {
        return new Listr([
          {
            title: 'Lookup directory to store the logs',
            task: (ctx) => {
              return Promise.promisify(exists)(options.exportDir)
              .then((directoryExists) => {
                ctx.logDirectoryExists = directoryExists
              })
              .catch(() => {
                ctx.logDirectoryExists = false
              })
            }
          },
          {
            title: 'Create log directory',
            task: (ctx) => {
              return Promise.promisify(mkdirp)(options.exportDir)
            },
            skip: (ctx) => !ctx.logDirectoryExists
          },
          {
            title: 'Writing data to file',
            task: (ctx) => {
              return bfj.write(logFilePath, ctx.data, {
                circular: 'ignore',
                space: 2
              })
            }
          }
        ])
      },
      skip: () => !options.saveFile
    }
  ], listrOptions)

  return tasks.run({
    data: {}
  })
  .then((ctx) => {
    const resultTypes = Object.keys(ctx.data)
    if (resultTypes.length) {
      const resultTable = new Table()

      resultTable.push([{colSpan: 2, content: 'Exported entities'}])

      resultTypes.forEach((type) => {
        resultTable.push([startCase(type), ctx.data[type].length])
      })

      console.log(resultTable.toString())
    } else {
      console.log('No data was exported')
    }

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

    console.log(`The export took ${durationHuman} (${durationSeconds}s)`)
    if (options.saveFile) {
      console.log(`\nStored space data to json file at: ${logFilePath}`)
    }
    return ctx.data
  })
  .catch((err) => {
    errorLog.push(err)
  })
  .then(() => {
    return displayErrorLog(errorLog)
  })
  .then(() => {
    if (errorLog.length) {
      return writeLogFile(errorLogFilePath, errorLog)
    }
  })
}
