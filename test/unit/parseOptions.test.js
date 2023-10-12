import { HttpsProxyAgent } from 'https-proxy-agent'
import { basename, isAbsolute, resolve, sep } from 'path'
import parseOptions from '../../lib/parseOptions'

const spaceId = 'foo'
const managementToken = 'someManagementToken'
const basePath = resolve(__dirname, '..', '..')

const toBeAbsolutePathWithPattern = (received, pattern) => {
  const escapedPattern = [basename(basePath), pattern].join(`\\${sep}`)

  return (!isAbsolute(received) || !RegExp(`/${escapedPattern}$/`).test(received))
}

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

test('parseOptions sets correct default options', async () => {
  const { default: packageJson } = await import(resolve(basePath, 'package.json'))
  const version = packageJson.version

  const options = parseOptions({ spaceId, managementToken })

  const contentFileNamePattern = `contentful-export-${spaceId}-master-[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}-[0-9]{2}-[0-9]{2}\\.json`
  const errorFileNamePattern = `contentful-export-error-log-${spaceId}-master-[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}-[0-9]{2}-[0-9]{2}\\.json`

  expect(options.contentFile).toMatch(new RegExp(`^${contentFileNamePattern}$`))
  expect(toBeAbsolutePathWithPattern(options.errorLogFile, errorFileNamePattern)).toBe(true)
  expect(options.exportDir).toBe(basePath)
  expect(options.includeDrafts).toBe(false)
  expect(options.includeArchived).toBe(false)
  expect(toBeAbsolutePathWithPattern(options.logFilePath, contentFileNamePattern)).toBe(true)
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
  expect(options.skipTags).toBe(false)
  expect(options.stripTags).toBe(false)
  expect(options.spaceId).toBe(spaceId)
  expect(options.startTime).toBeInstanceOf(Date)
  expect(options.useVerboseRenderer).toBe(false)
  expect(options.deliveryToken).toBeUndefined()
})

test('parseOption accepts config file', async () => {
  const configFileName = 'example-config.test.json'
  const { default: config } = await import(resolve(basePath, configFileName))

  const options = parseOptions({ config: configFileName })
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
  expect(options.httpsAgent).toBeInstanceOf(HttpsProxyAgent)
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
  expect(options.httpsAgent).toBeInstanceOf(HttpsProxyAgent)
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

test('parseOption parses headers option', () => {
  const options = parseOptions({
    spaceId,
    managementToken,
    headers: {
      header1: '1',
      header2: '2'
    }
  })
  expect(options.headers).toEqual({
    header1: '1',
    header2: '2',
    'CF-Sequence': expect.any(String)
  })
})

test('parses params.header if provided', function () {
  const config = parseOptions({
    spaceId,
    managementToken,
    header: ['Accept   : application/json ', ' X-Header: 1']
  })
  expect(config.headers).toEqual({ Accept: 'application/json', 'X-Header': '1', 'CF-Sequence': expect.any(String) })
})
