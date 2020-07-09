import { access } from 'fs'

import bfj from 'bfj'
import Promise from 'bluebird'
import Table from 'cli-table3'
import Listr from 'listr'
import UpdateRenderer from 'listr-update-renderer'
import VerboseRenderer from 'listr-verbose-renderer'
import { startCase } from 'lodash'
import mkdirp from 'mkdirp'
import moment from 'moment'

import { wrapTask } from 'contentful-batch-libs/dist/listr'
import {
  setupLogging,
  displayErrorLog,
  writeErrorLogFile
} from 'contentful-batch-libs/dist/logging'

import downloadAssets from './tasks/download-assets'
import getSpaceData from './tasks/get-space-data'
import initClient from './tasks/init-client'

import parseOptions from './parseOptions'

const accessP = Promise.promisify(access)

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
  const log = []
  const options = parseOptions(params)

  const listrOptions = createListrOptions(options)

  // Setup custom error listener to store errors for later
  setupLogging(log)

  const tasks = new Listr([
    {
      title: 'Initialize client',
      task: wrapTask((ctx) => {
        try {
          // CMA client
          ctx.client = initClient(options)
          if (options.deliveryToken && !options.includeDrafts) {
            // CDA client for fetching only public entries
            ctx.cdaClient = initClient(options, true)
          }
          return Promise.resolve()
        } catch (err) {
          return Promise.reject(err)
        }
      })
    },
    {
      title: 'Fetching data from space',
      task: (ctx) => {
        return getSpaceData({
          client: ctx.client,
          cdaClient: ctx.cdaClient,
          spaceId: options.spaceId,
          environmentId: options.environmentId,
          maxAllowedLimit: options.maxAllowedLimit,
          includeDrafts: options.includeDrafts,
          includeArchived: options.includeArchived,
          skipContentModel: options.skipContentModel,
          skipEditorInterfaces: options.skipEditorInterfaces,
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
      task: wrapTask(downloadAssets(options)),
      skip: (ctx) => !options.downloadAssets || !Object.prototype.hasOwnProperty.call(ctx.data, 'assets')
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
              return mkdirp(options.exportDir)
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

        resultTable.push([{ colSpan: 2, content: 'Exported entities' }])

        resultTypes.forEach((type) => {
          resultTable.push([startCase(type), ctx.data[type].length])
        })

        console.log(resultTable.toString())
      } else {
        console.log('No data was exported')
      }

      if ('assetDownloads' in ctx) {
        const downloadsTable = new Table()
        downloadsTable.push([{ colSpan: 2, content: 'Asset file download results' }])
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
      // @todo this should live in batch libs
      const errorLog = log.filter((logMessage) => logMessage.level !== 'info' && logMessage.level !== 'warning')
      const displayLog = log.filter((logMessage) => logMessage.level !== 'info')
      displayErrorLog(displayLog)

      if (errorLog.length) {
        return writeErrorLogFile(options.errorLogFile, errorLog)
          .then(() => {
            const multiError = new Error('Errors occured')
            multiError.name = 'ContentfulMultiError'
            multiError.errors = errorLog
            throw multiError
          })
      }

      console.log('The export was successful.')

      return data
    })
}
