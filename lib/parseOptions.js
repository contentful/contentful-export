import { resolve } from 'path'

import HttpsProxyAgent from 'https-proxy-agent'
import HttpProxyAgent from 'http-proxy-agent'
import moment from 'moment'

import { version } from '../package'
import { proxyStringToObject } from './utils/proxy'

export default function parseOptions (params) {
  const defaultOptions = {
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

  options.logFilePath = `${options.exportDir}/contentful-export-${options.spaceId}-${options.startTime.format('YYYY-MM-DDTHH-mm-SS')}.json`
  if (!options.errorLogFile) {
    options.errorLogFile = resolve(options.exportDir, `contentful-export-error-log-${options.spaceId}-${options.startTime.format('YYYY-MM-DDTHH-mm-SS')}.json`)
  } else {
    options.errorLogFile = resolve(process.cwd(), options.errorLogFile)
  }

  // Further processing
  options.sourceSpace = options.spaceId
  options.sourceManagementToken = options.managementToken

  if (typeof options.proxy === 'string') {
    options.proxy = proxyStringToObject(options.proxy)
  }

  if (options.proxy && options.proxy.isHttps) {
    options.httpsAgent = new HttpsProxyAgent(options.proxy)
    delete options.proxy
  } else if (options.proxy && !options.proxy.isHttps) {
    options.httpAgent = new HttpProxyAgent(options.proxy)
    delete options.proxy
  }

  options.managementApplication = options.managementApplication || `contentful.export/${version}`
  return options
}
