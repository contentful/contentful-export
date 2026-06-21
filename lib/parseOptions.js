import { addSequenceHeader, agentFromProxy, proxyStringToObject } from 'contentful-batch-libs'
import { format } from 'date-fns/format'
import { resolve } from 'path'
import qs from 'querystring'
import { version } from '../package.json'
import { getHeadersConfig } from './utils/headers'

export default async function parseOptions (params) {
  const defaultOptions = {
    environmentId: 'master',
    exportDir: process.cwd(),
    includeDrafts: false,
    includeArchived: false,
    skipRoles: false,
    skipContentModel: false,
    skipEditorInterfaces: false,
    skipContent: false,
    skipWebhooks: false,
    skipTags: false,
    stripTags: false,
    maxAllowedLimit: 1000,
    saveFile: true,
    useVerboseRenderer: false,
    rawProxy: false
  }

  let configFile = {}
  if (params.config) {
    const externalConfigFile = await import(resolve(process.cwd(), params.config))
    configFile = externalConfigFile.default
  }

  const options = {
    ...defaultOptions,
    ...configFile,
    ...params,
    headers: addSequenceHeader(params.headers || getHeadersConfig(params.header))
  }

  // Validation
  if (!options.spaceId) {
    throw new Error('The `spaceId` option is required.')
  }

  if (!options.managementToken) {
    throw new Error('The `managementToken` option is required.')
  }

  options.startTime = new Date()
  options.contentFile =
    options.contentFile ||
    `contentful-export-${options.spaceId}-${options.environmentId}-${format(options.startTime, "yyyy-MM-dd'T'HH-mm-ss")}.json`

  options.logFilePath = resolve(options.exportDir, options.contentFile)

  if (!options.errorLogFile) {
    options.errorLogFile = resolve(
      options.exportDir,
      `contentful-export-error-log-${options.spaceId}-${options.environmentId}-${format(options.startTime, "yyyy-MM-dd'T'HH-mm-ss")}.json`
    )
  } else {
    options.errorLogFile = resolve(process.cwd(), options.errorLogFile)
  }

  // Further processing
  options.accessToken = options.managementToken

  if (options.proxy) {
    if (typeof options.proxy === 'string') {
      const proxySimpleExp = /.+:\d+/
      const proxyAuthExp = /.+:.+@.+:\d+/
      if (!(proxySimpleExp.test(options.proxy) || proxyAuthExp.test(options.proxy))) {
        throw new Error(
          'Please provide the proxy config in the following format:\nhost:port or user:password@host:port'
        )
      }
      options.proxy = proxyStringToObject(options.proxy)
    }

    if (!options.rawProxy) {
      options.httpsAgent = agentFromProxy(options.proxy)
      delete options.proxy
    }
  }

  if (options.queryEntries && options.queryEntries.length > 0) {
    const querystr = options.queryEntries.join('&')
    options.queryEntries = qs.parse(querystr)
  }

  if (options.queryAssets && options.queryAssets.length > 0) {
    const querystr = options.queryAssets.join('&')
    options.queryAssets = qs.parse(querystr)
  }

  if (options.contentOnly) {
    options.skipRoles = true
    options.skipContentModel = true
    options.skipWebhooks = true
  }

  options.application = options.managementApplication || `contentful.export/${version}`
  options.feature = options.managementFeature || 'library-export'
  return options
}
