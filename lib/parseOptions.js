import { resolve } from 'path'

import moment from 'moment'

import { proxyStringToObject, agentFromProxy } from 'contentful-batch-libs/dist/proxy'

import { version } from '../package'

import qs from 'querystring'

export default function parseOptions (params) {
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
    maxAllowedLimit: 1000,
    saveFile: true,
    useVerboseRenderer: false,
    rawProxy: false
  }

  const configFile = params.config
    ? require(resolve(process.cwd(), params.config))
    : {}

  const options = {
    ...defaultOptions,
    ...configFile,
    ...params
  }

  // Validation
  if (!options.spaceId) {
    throw new Error('The `spaceId` option is required.')
  }

  if (!options.managementToken) {
    throw new Error('The `managementToken` option is required.')
  }

  const proxySimpleExp = /.+:\d+/
  const proxyAuthExp = /.+:.+@.+:\d+/
  if (options.proxy && !(proxySimpleExp.test(options.proxy) || proxyAuthExp.test(options.proxy))) {
    throw new Error('Please provide the proxy config in the following format:\nhost:port or user:password@host:port')
  }

  options.startTime = moment()
  options.contentFile = options.contentFile || `contentful-export-${options.spaceId}-${options.environmentId}-${options.startTime.format('YYYY-MM-DDTHH-mm-SS')}.json`

  options.logFilePath = resolve(options.exportDir, options.contentFile)

  if (!options.errorLogFile) {
    options.errorLogFile = resolve(options.exportDir, `contentful-export-error-log-${options.spaceId}-${options.environmentId}-${options.startTime.format('YYYY-MM-DDTHH-mm-SS')}.json`)
  } else {
    options.errorLogFile = resolve(process.cwd(), options.errorLogFile)
  }

  // Further processing
  options.accessToken = options.managementToken

  if (typeof options.proxy === 'string') {
    options.proxy = proxyStringToObject(options.proxy)
  }

  if (!options.rawProxy && options.proxy) {
    options.httpsAgent = agentFromProxy(options.proxy)
    delete options.proxy
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
  options.feature = options.managementFeature || `library-export`
  return options
}
