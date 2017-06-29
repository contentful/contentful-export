import { parse, format } from 'url'
import { toInteger } from 'lodash'
import HttpsProxyAgent from 'https-proxy-agent'

function serializeAuth ({ username, password } = {}) {
  if (!username) {
    return ''
  }

  if (!password) {
    return username
  }

  return `${username}:${password}`
}

function parseAuth (authString) {
  // authString may be a falsy value like `null`
  const [username, password] = (authString || '').split(':')
  return { username, password }
}

export function proxyStringToObject (proxyString) {
  if (!proxyString.startsWith('http')) {
    return proxyStringToObject(`http://${proxyString}`)
  }

  const {
    hostname: host,
    port: portString,
    auth: authString,
    protocol
  } = parse(proxyString)

  const auth = parseAuth(authString)
  const port = toInteger(portString)
  const isHttps = protocol === 'https:'

  if (!auth.username) {
    return { host, port, isHttps }
  }

  return {
    host,
    port,
    auth,
    isHttps
  }
}
export function agentFromProxy (proxy) {
  if (!proxy) {
    return {}
  }
  ['http_proxy', 'https_proxy'].forEach((envStr) => {
    delete process.env[envStr]
    delete process.env[envStr.toUpperCase()]
  })
  const { host, port } = proxy
  const agent = new HttpsProxyAgent({ host, port })
  return { httpsAgent: agent }
}

export function proxyObjectToString (proxyObject) {
  const { host: hostname, port, auth: authObject } = proxyObject
  const auth = serializeAuth(authObject)

  const formatted = format({ hostname, port, auth })

  // Ugly fix for Node 6 vs Node 8 behavior
  return formatted.replace(/^\/\//, '')
}
