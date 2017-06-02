import { resolve } from 'path'
import { version } from '../package'
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

  // Further processing
  options.sourceSpace = options.spaceId
  options.sourceManagementToken = options.managementToken

  if (!options.errorLogFile) {
    options.errorLogFile = options.exportDir + '/contentful-export-' + Date.now() + '.log'
  }

  if (typeof options.proxy === 'string') {
    const chunks = options.proxy.split('@')
    if (chunks.length > 1) {
      // Advanced proxy config with auth credentials
      const auth = chunks[0].split(':')
      const host = chunks[1].split(':')
      options.proxy = {
        host: host[0],
        port: parseInt(host[1]),
        auth: {
          username: auth[0],
          password: auth[1]
        }
      }
    } else {
      // Simple proxy config without auth credentials
      const host = chunks[0].split(':')
      options.proxy = {
        host: host[0],
        port: parseInt(host[1])
      }
    }
  }

  options.managementApplication = options.managementApplication || `contentful.export/${version}`
  return options
}
