import { resolve } from 'path'

import runContentfulExport from '../../lib/index'

import getFullSourceSpace from 'contentful-batch-libs/dist/get/get-full-source-space'
import createClients from 'contentful-batch-libs/dist/utils/create-clients'
import {
  setupLogging,
  displayErrorLog,
  writeErrorLogFile
} from 'contentful-batch-libs/dist/utils/logging'
import bfj from 'bfj-node4'
import fs from 'fs'
import mkdirp from 'mkdirp'

jest.mock('../../lib/download-asset', () => Promise.resolve())
jest.mock('contentful-batch-libs/dist/get/get-full-source-space', () => jest.fn(() => ({
  'contentTypes': [],
  'entries': [],
  'assets': [],
  'locales': []
})))
jest.mock('contentful-batch-libs/dist/utils/create-clients', () => jest.fn(() => ({
  source: {
    delivery: {}
  },
  destination: {
    management: {}
  }
})))
jest.mock('contentful-batch-libs/dist/utils/logging', () => ({
  setupLogging: jest.fn(),
  displayErrorLog: jest.fn(),
  writeErrorLogFile: jest.fn((destination, errorLog) => {
    const multiError = new Error('Errors occured')
    multiError.name = 'ContentfulMultiError'
    multiError.errors = errorLog
    throw multiError
  })
}))
jest.mock('fs', () => ({
  access: jest.fn(() => Promise.resolve(true))
}))
jest.mock('bfj-node4', () => ({
  write: jest.fn(() => Promise.resolve())
}))
jest.mock('mkdirp', () => jest.fn())
jest.mock('bluebird', () => ({
  promisify: jest.fn((fn) => fn)
}))

afterEach(() => {
  createClients.mockClear()
  getFullSourceSpace.mockClear()
  setupLogging.mockClear()
  displayErrorLog.mockClear()
  fs.access.mockClear()
  mkdirp.mockClear()
  bfj.write.mockClear()
  writeErrorLogFile.mockClear()
})

test('Runs Contentful Export', () => {
  return runContentfulExport({
    errorLogFile: 'errorlogfile',
    spaceId: 'someSpaceId',
    managementToken: 'someManagementToken'
  })
    .then((returnedData) => {
      expect(createClients.mock.calls).toHaveLength(1)
      expect(getFullSourceSpace.mock.calls).toHaveLength(1)
      expect(setupLogging.mock.calls).toHaveLength(1)
      expect(displayErrorLog.mock.calls).toHaveLength(1)
      expect(fs.access.mock.calls).toHaveLength(1)
      expect(mkdirp.mock.calls).toHaveLength(1)
      expect(bfj.write.mock.calls).toHaveLength(1)
      expect(writeErrorLogFile.mock.calls).toHaveLength(0)
    })
})

test('Creates a valid and correct opts object', () => {
  const errorLogFile = 'errorlogfile'
  const exampleConfig = require('../../example-config.json')

  return runContentfulExport({
    errorLogFile,
    config: resolve(__dirname, '..', '..', 'example-config.json')
  })
    .then(() => {
      expect(createClients.mock.calls[0][0].skipContentModel).toBeFalsy()
      expect(createClients.mock.calls[0][0].errorLogFile).toBe(resolve(process.cwd(), errorLogFile))
      expect(createClients.mock.calls[0][0].spaceId).toBe(exampleConfig.spaceId)
      expect(createClients.mock.calls).toHaveLength(1)
      expect(getFullSourceSpace.mock.calls).toHaveLength(1)
      expect(setupLogging.mock.calls).toHaveLength(1)
      expect(displayErrorLog.mock.calls).toHaveLength(1)
      expect(fs.access.mock.calls).toHaveLength(1)
      expect(mkdirp.mock.calls).toHaveLength(1)
      expect(bfj.write.mock.calls).toHaveLength(1)
      expect(writeErrorLogFile.mock.calls).toHaveLength(0)
    })
})

test('Run Contentful export fails due to rejection', () => {
  const rejectError = new Error()
  rejectError.request = {uri: 'erroruri'}
  getFullSourceSpace.mockImplementation(() => Promise.reject(rejectError))

  return runContentfulExport({
    errorLogFile: 'errorlogfile',
    spaceId: 'someSpaceId',
    managementToken: 'someManagementToken'
  })
    .then(() => {
      throw new Error('should not resolve')
    })
    .catch(() => {
      expect(createClients.mock.calls).toHaveLength(1)
      expect(getFullSourceSpace.mock.calls).toHaveLength(1)
      expect(setupLogging.mock.calls).toHaveLength(1)
      expect(displayErrorLog.mock.calls).toHaveLength(1)
      expect(fs.access.mock.calls).toHaveLength(0)
      expect(mkdirp.mock.calls).toHaveLength(0)
      expect(bfj.write.mock.calls).toHaveLength(0)
      expect(writeErrorLogFile.mock.calls).toHaveLength(1)
    })
})
