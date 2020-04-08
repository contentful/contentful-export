import { resolve } from 'path'

import moment from 'moment'
import HttpsProxyAgent from 'https-proxy-agent'

import parseOptions from '../../lib/parseOptions'

const spaceId = 'foo'
const managementToken = 'someManagementToken'
const basePath = resolve(__dirname, '..', '..')

test('parseOptions sets requires spaceId', () => {
  expect(
    () => parseOptions({})
  ).toThrow('The `spaceId` option is required.')
})

test('parseOptions sets requires managementToken', () => {
  expect(
    () => parseOptions({
      spaceId: 'someSpaceId'
    })
  ).toThrow('The `managementToken` option is required.')
})

test('parseOptions sets correct default options', () => {
  const version = require(resolve(basePath, 'package.json')).version

  const options = parseOptions({
    spaceId,
    managementToken
  })

  const contentFileNamePattern = `contentful-export-${spaceId}-master-[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}-[0-9]{2}-[0-9]{2}\\.json`
  const errorFileNamePattern = `contentful-export-error-log-${spaceId}-master-[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}-[0-9]{2}-[0-9]{2}\\.json`

  expect(options.contentFile).toMatch(new RegExp(`^${contentFileNamePattern}$`))
  expect(options.errorLogFile).toMatch(new RegExp(`^${resolve(basePath, errorFileNamePattern)}$`))
  expect(options.exportDir).toBe(basePath)
  expect(options.includeDrafts).toBe(false)
  expect(options.includeArchived).toBe(false)
  expect(options.logFilePath).toMatch(new RegExp(`^${resolve(basePath, contentFileNamePattern)}$`))
  expect(options.application).toBe(`contentful.export/${version}`)
  expect(options.feature).toBe('library-export')
  expect(options.accessToken).toBe(managementToken)
  expect(options.maxAllowedLimit).toBe(1000)
  expect(options.saveFile).toBe(true)
  expect(options.skipContent).toBe(false)
  expect(options.skipContentModel).toBe(false)
  expect(options.skipEditorInterfaces).toBe(false)
  expect(options.skipRoles).toBe(false)
  expect(options.skipWebhooks).toBe(false)
  expect(options.spaceId).toBe(spaceId)
  expect(options.startTime).toBeInstanceOf(moment)
  expect(options.useVerboseRenderer).toBe(false)
  expect(options.deliveryToken).toBeUndefined()
})

test('parseOption accepts config file', () => {
  const configFileName = 'example-config.json'
  const config = require(resolve(basePath, configFileName))

  const options = parseOptions({
    config: configFileName
  })
  Object.keys(config).forEach((key) => {
    expect(options[key]).toBe(config[key])
  })
})

test('parseOption overwrites errorLogFile', () => {
  const errorLogFile = 'error.log'
  const options = parseOptions({
    spaceId,
    managementToken,
    errorLogFile
  })
  expect(options.errorLogFile).toBe(resolve(basePath, errorLogFile))
})

test('parseOption throws with invalid proxy', () => {
  expect(() => parseOptions({
    spaceId,
    managementToken,
    proxy: 'invalid'
  })).toThrow('Please provide the proxy config in the following format:\nhost:port or user:password@host:port')
})

test('parseOption accepts proxy config as string', () => {
  const options = parseOptions({
    spaceId,
    managementToken,
    proxy: 'localhost:1234'
  })
  expect(options).not.toHaveProperty('proxy')
  expect(JSON.stringify(options.httpsAgent.constructor)).toEqual(JSON.stringify(HttpsProxyAgent))
  expect(options.httpsAgent.options.host).toBe('localhost')
  expect(options.httpsAgent.options.port).toBe(1234)
  expect(options.httpsAgent.options).not.toHaveProperty('auth')
})

test.skip('parseOption accepts proxy config as object', () => {
  const options = parseOptions({
    spaceId,
    managementToken,
    proxy: {
      host: 'localhost',
      port: 1234,
      user: 'foo',
      password: 'bar'
    }
  })
  expect(options).not.toHaveProperty('proxy')
  expect(JSON.stringify(options.httpsAgent.constructor)).toEqual(JSON.stringify(HttpsProxyAgent))
  expect(options.httpsAgent.options.host).toBe('localhost')
  expect(options.httpsAgent.options.port).toBe(1234)
  expect(options.httpsAgent.options).not.toHaveProperty('auth')
}, 'broken')

test('parseOptions parses queryEntries option', () => {
  const options = parseOptions({
    spaceId,
    managementToken,
    queryEntries: [
      'someParam=someValue',
      'someOtherParam=someOtherValue'
    ]
  })
  expect(options.queryEntries).toMatchObject({
    someParam: 'someValue',
    someOtherParam: 'someOtherValue'
  })
})

test('parseOptions parses queryAssets option', () => {
  const options = parseOptions({
    spaceId,
    managementToken,
    queryAssets: [
      'someParam=someValue',
      'someOtherParam=someOtherValue'
    ]
  })
  expect(options.queryAssets).toMatchObject({
    someParam: 'someValue',
    someOtherParam: 'someOtherValue'
  })
})

test('parseOptions sets correct options given contentOnly', () => {
  const options = parseOptions({
    spaceId,
    managementToken,
    contentOnly: true
  })
  expect(options.skipRoles).toBe(true)
  expect(options.skipContentModel).toBe(true)
  expect(options.skipWebhooks).toBe(true)
})

test('parseOptions accepts custom application & feature', () => {
  const managementApplication = 'managementApplicationMock'
  const managementFeature = 'managementFeatureMock'

  const options = parseOptions({
    spaceId,
    managementToken,
    managementApplication,
    managementFeature
  })

  expect(options.application).toBe(managementApplication)
  expect(options.feature).toBe(managementFeature)
})

test('parseOption parses deliveryToken option', () => {
  const options = parseOptions({
    spaceId,
    managementToken,
    deliveryToken: 'testDeliveryToken'
  })
  expect(options.accessToken).toBe(managementToken)
  expect(options.spaceId).toBe(spaceId)
  expect(options.deliveryToken).toBe('testDeliveryToken')
})
