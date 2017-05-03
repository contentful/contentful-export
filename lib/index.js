import createClients from 'contentful-batch-libs/dist/utils/create-clients'
import dumpErrorBuffer from './dump-error-buffer'
import downloadAsset from './download-asset'
import fs from 'fs'
import getFullSourceSpace from 'contentful-batch-libs/dist/get/get-full-source-space'
import Promise from 'bluebird'
import jsonStringifySafe from 'json-stringify-safe'
import log from 'npmlog'
import Listr from 'listr'
import UpdateRenderer from 'listr-update-renderer'
import VerboseRenderer from 'listr-verbose-renderer'
import { resolve } from 'path'
import { startCase } from 'lodash'
import Table from 'cli-table2'
import moment from 'moment'

const summary = {}

function createListrOptions (opts) {
  if (opts.useVerboseRenderer) {
    return {
      renderer: VerboseRenderer
    }
  }
  return {
    renderer: UpdateRenderer,
    collapse: false
  }
}

export default function runContentfulExport (usageParams) {
  const defaultOpts = {
    exportDir: process.cwd(),
    includeDrafts: false,
    skipRoles: false,
    skipContentModel: false,
    skipContent: false,
    skipWebhooks: false,
    maxAllowedLimit: 1000,
    saveFile: true,
    useVerboseRenderer: false
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

  if (typeof opts.proxy === 'string') {
    const chunks = opts.proxy.split('@')
    if (chunks.length > 1) {
      const auth = chunks[0].split(':')
      const host = chunks[1].split(':')
      opts.proxy = {
        host: host[0],
        port: parseInt(host[1]),
        auth: {
          username: auth[0],
          password: auth[1]
        }
      }
    } else {
      const host = chunks[0].split(':')
      opts.proxy = {
        host: host[0],
        port: parseInt(host[1])
      }
    }
  }

  const listrOptions = createListrOptions(opts)

  const tasks = new Listr([
    {
      title: 'Initialize clients',
      task: (ctx) => {
        ctx.clients = createClients(opts)
      }
    },
    {
      title: 'Fetching data from space',
      task: (ctx) => {
        return getFullSourceSpace({
          managementClient: ctx.clients.source.management,
          spaceId: ctx.clients.source.spaceId,
          maxAllowedLimit: opts.maxAllowedLimit,
          includeDrafts: opts.includeDrafts,
          skipContentModel: opts.skipContentModel,
          skipContent: opts.skipContent,
          skipWebhooks: opts.skipWebhooks,
          skipRoles: opts.skipRoles,
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
            log.warn('-> asset has no file(s)', jsonStringifySafe(asset))
            warningCount++
            return
          }
          const locales = Object.keys(asset.fields.file)
          return Promise.mapSeries(locales, (locale) => {
            const url = asset.fields.file[locale].url || asset.fields.file[locale].upload
            return downloadAsset(url, opts.exportDir)
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
      skip: () => !opts.downloadAssets
    },
    {
      title: 'Writing data to file',
      task: (ctx) => {
        fs.existsSync(opts.exportDir) || fs.mkdirSync(opts.exportDir)
        ctx.responseFile = `${opts.exportDir}/contentful-export-${ctx.clients.source.spaceId}-${Date.now()}.json`
        fs.writeFileSync(ctx.responseFile, jsonStringifySafe(ctx.data, null, 4))
        return ctx
      },
      skip: () => !opts.saveFile
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
    if (opts.saveFile) {
      log.info('export', `Stored space data to json file at: ${ctx.responseFile}`)
    }
    return ctx.data
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
