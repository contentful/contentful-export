import initClient from '../../../lib/tasks/init-client'

import contentfulManagement from 'contentful-management'
import { logEmitter } from 'contentful-batch-libs/dist/logging'

jest.mock('contentful-management', () => {
  return {
    createClient: jest.fn(() => 'cmaClient')
  }
})

jest.mock('contentful-batch-libs/dist/logging', () => {
  return {
    logEmitter: {
      emit: jest.fn()
    }
  }
})

test('does create clients and passes custom logHandler', () => {
  const opts = {
    httpAgent: 'httpAgent',
    httpsAgent: 'httpsAgent',
    application: 'application',
    headers: 'headers',
    host: 'host',
    insecure: 'insecure',
    integration: 'integration',
    port: 'port',
    proxy: 'proxy',
    accessToken: 'accessToken',
    spaceId: 'spaceId'
  }

  initClient(opts)

  expect(contentfulManagement.createClient.mock.calls[0][0]).toMatchObject({
    accessToken: opts.accessToken,
    host: opts.host,
    port: opts.port,
    headers: opts.headers,
    insecure: opts.insecure,
    proxy: opts.proxy,
    httpAgent: opts.httpAgent,
    httpsAgent: opts.httpsAgent,
    application: opts.application,
    integration: opts.integration
  })
  expect(contentfulManagement.createClient.mock.calls[0][0]).toHaveProperty('logHandler')
  expect(contentfulManagement.createClient.mock.calls[0][0].timeout).toEqual(10000)
  expect(contentfulManagement.createClient.mock.calls).toHaveLength(1)

  // Call passed log handler
  contentfulManagement.createClient.mock.calls[0][0].logHandler('level', 'logMessage')

  expect(logEmitter.emit.mock.calls[0][0]).toBe('level')
  expect(logEmitter.emit.mock.calls[0][1]).toBe('logMessage')
})
