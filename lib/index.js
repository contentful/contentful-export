import { access } from 'fs'

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
  setupLogging,
  displayErrorLog,
  writeErrorLogFile
} from 'contentful-batch-libs/dist/utils/logging'

import downloadAsset from './download-asset'

import parseOptions from './parseOptions'

const accessP = Promise.promisify(access)
const mkdirpP = Promise.promisify(mkdirp)

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
  const summary = {}
  const log = []
  const options = parseOptions(params)

  const listrOptions = createListrOptions(options)

  // Setup custom error listener to store errors for later
  setupLogging(log)

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
          listrOptions,
          queryEntries: options.queryEntries,
          queryAssets: options.queryAssets
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
              return accessP(options.exportDir)
                .then(() => {
                  ctx.logDirectoryExists = true
                })
                .catch(() => {
                  ctx.logDirectoryExists = false
                })
            }
          },
          {
            title: 'Create log directory',
            task: (ctx) => {
              return mkdirpP(options.exportDir)
            },
            skip: (ctx) => !ctx.logDirectoryExists
          },
          {
            title: 'Writing data to file',
            task: (ctx) => {
              return bfj.write(options.logFilePath, ctx.data, {
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

      const durationHuman = options.startTime.fromNow(true)
      const durationSeconds = moment().diff(options.startTime, 'seconds')

      console.log(`The export took ${durationHuman} (${durationSeconds}s)`)
      if (options.saveFile) {
        console.log(`\nStored space data to json file at: ${options.logFilePath}`)
      }
      return ctx.data
    })
    .catch((err) => {
      log.push({
        ts: (new Date()).toJSON(),
        level: 'error',
        error: err
      })
    })
    .then((data) => {
      const errorLog = log.filter((logMessage) => logMessage.level !== 'info' || logMessage.level !== 'warning')
      const warningLog = log.filter((logMessage) => logMessage.level !== 'error' && logMessage.level !== 'info')
      displayErrorLog(warningLog)
      if (errorLog.length) {
        displayErrorLog(errorLog)
        return writeErrorLogFile(options.errorLogFile, errorLog)
          .then(() => {
            const multiError = new Error('Errors occured')
            multiError.name = 'ContentfulMultiError'
            multiError.errors = errorLog
            throw multiError
          })
      }
      return data
    })
}
