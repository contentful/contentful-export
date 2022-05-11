import { resolve } from 'path'

import bfj from 'bfj'
import fs from 'fs'
import mkdirp from 'mkdirp'

import {
  setupLogging,
  displayErrorLog,
  writeErrorLogFile
} from 'contentful-batch-libs'

import { mockDownloadAssets } from './mocks/download-assets'
import { mockGetSpaceData } from './mocks/get-space-data'

import downloadAssets from '../../lib/tasks/download-assets'
import getSpaceData from '../../lib/tasks/get-space-data'
import initClient from '../../lib/tasks/init-client'
import runContentfulExport from '../../lib/index'

jest.spyOn(global.console, 'log')
jest.mock('../../lib/tasks/init-client')
jest.mock('../../lib/tasks/download-assets', () => jest.fn(() => mockDownloadAssets))
jest.mock('../../lib/tasks/get-space-data', () => jest.fn(mockGetSpaceData))

jest.mock('fs', () => ({ access: jest.fn((path, cb) => cb()) }))
jest.mock('mkdirp', () => jest.fn())
jest.mock('bfj', () => ({ write: jest.fn().mockResolvedValue() }))
jest.mock('contentful-batch-libs/dist/logging', () => ({
  setupLogging: jest.fn(),
  displayErrorLog: jest.fn(),
  logToTaskOutput: () => jest.fn(),
  writeErrorLogFile: jest.fn((destination, errorLog) => {
    const multiError = new Error('Errors occured')
    multiError.name = 'ContentfulMultiError'
    multiError.errors = errorLog
    throw multiError
  })
}))

afterEach(() => {
  initClient.mockClear()
  getSpaceData.mockClear()
  setupLogging.mockClear()
  displayErrorLog.mockClear()
  fs.access.mockClear()
  mkdirp.mockClear()
  bfj.write.mockClear()
  writeErrorLogFile.mockClear()
  downloadAssets.mockClear()
  global.console.log.mockClear()
})

test('Runs Contentful Export with default config', async () => {
  await runContentfulExport({
    errorLogFile: 'errorlogfile',
    spaceId: 'someSpaceId',
    managementToken: 'someManagementToken'
  })

  expect(initClient.mock.calls).toHaveLength(1)
  expect(getSpaceData.mock.calls).toHaveLength(1)
  expect(setupLogging.mock.calls).toHaveLength(1)
  expect(downloadAssets.mock.calls).toHaveLength(1)
  expect(displayErrorLog.mock.calls).toHaveLength(1)
  expect(fs.access.mock.calls).toHaveLength(1)
  expect(mkdirp.mock.calls).toHaveLength(1)
  expect(bfj.write.mock.calls).toHaveLength(1)
  expect(writeErrorLogFile.mock.calls).toHaveLength(0)
  const exportedTable = global.console.log.mock.calls.find((call) => call[0].match(/Exported entities/))
  expect(exportedTable).not.toBeUndefined()
  expect(exportedTable[0]).toMatch(/Exported entities/)
  expect(exportedTable[0]).toMatch(/Content Types.+0/)
  expect(exportedTable[0]).toMatch(/Entries.+0/)
  expect(exportedTable[0]).toMatch(/Assets.+2/)
  expect(exportedTable[0]).toMatch(/Locales.+0/)
  const assetsTable = global.console.log.mock.calls.find((call) => call[0].match(/Asset file download results/))
  expect(assetsTable).toBeUndefined()
})

test('Runs Contentful Export and downloads assets', async () => {
  await runContentfulExport({
    errorLogFile: 'errorlogfile',
    spaceId: 'someSpaceId',
    managementToken: 'someManagementToken',
    downloadAssets: true
  })

  expect(initClient.mock.calls).toHaveLength(1)
  expect(getSpaceData.mock.calls).toHaveLength(1)
  expect(setupLogging.mock.calls).toHaveLength(1)
  expect(downloadAssets.mock.calls).toHaveLength(1)
  expect(displayErrorLog.mock.calls).toHaveLength(1)
  expect(fs.access.mock.calls).toHaveLength(1)
  expect(mkdirp.mock.calls).toHaveLength(1)
  expect(bfj.write.mock.calls).toHaveLength(1)
  expect(writeErrorLogFile.mock.calls).toHaveLength(0)
  const exportedTable = global.console.log.mock.calls.find((call) => call[0].match(/Exported entities/))
  expect(exportedTable).not.toBeUndefined()
  expect(exportedTable[0]).toMatch(/Exported entities/)
  expect(exportedTable[0]).toMatch(/Content Types.+0/)
  expect(exportedTable[0]).toMatch(/Entries.+0/)
  expect(exportedTable[0]).toMatch(/Assets.+2/)
  expect(exportedTable[0]).toMatch(/Locales.+0/)
  const assetsTable = global.console.log.mock.calls.find((call) => call[0].match(/Asset file download results/))
  expect(assetsTable).not.toBeUndefined()
  expect(assetsTable[0]).toMatch(/Asset file download results/)
  expect(assetsTable[0]).toMatch(/Successful.+3/)
  expect(assetsTable[0]).toMatch(/Warnings.+2/)
  expect(assetsTable[0]).toMatch(/Errors.+1/)
})

test('Creates a valid and correct opts object', async () => {
  const errorLogFile = 'errorlogfile'
  const { default: exampleConfig } = await import('../../example-config.test.json')

  await runContentfulExport({
    errorLogFile,
    config: resolve(__dirname, '..', '..', 'example-config.test.json')
  })

  expect(initClient.mock.calls[0][0].skipContentModel).toBeFalsy()
  expect(initClient.mock.calls[0][0].skipEditorInterfaces).toBeFalsy()
  expect(initClient.mock.calls[0][0].errorLogFile).toBe(resolve(process.cwd(), errorLogFile))
  expect(initClient.mock.calls[0][0].spaceId).toBe(exampleConfig.spaceId)
  expect(initClient.mock.calls).toHaveLength(1)
  expect(getSpaceData.mock.calls).toHaveLength(1)
  expect(setupLogging.mock.calls).toHaveLength(1)
  expect(downloadAssets.mock.calls).toHaveLength(1)
  expect(displayErrorLog.mock.calls).toHaveLength(1)
  expect(fs.access.mock.calls).toHaveLength(1)
  expect(mkdirp.mock.calls).toHaveLength(1)
  expect(bfj.write.mock.calls).toHaveLength(1)
  expect(writeErrorLogFile.mock.calls).toHaveLength(0)
  const exportedTable = global.console.log.mock.calls.find((call) => call[0].match(/Exported entities/))
  expect(exportedTable).not.toBeUndefined()
  expect(exportedTable[0]).toMatch(/Exported entities/)
  expect(exportedTable[0]).toMatch(/Content Types.+0/)
  expect(exportedTable[0]).toMatch(/Entries.+0/)
  expect(exportedTable[0]).toMatch(/Assets.+2/)
  expect(exportedTable[0]).toMatch(/Locales.+0/)
})

test('Run Contentful export fails due to rejection', async () => {
  const rejectError = new Error()
  rejectError.request = { uri: 'erroruri' }
  getSpaceData.mockImplementation(() => Promise.reject(rejectError))

  await expect(runContentfulExport({
    errorLogFile: 'errorlogfile',
    spaceId: 'someSpaceId',
    managementToken: 'someManagementToken'
  })).rejects.toThrow()

  expect(initClient.mock.calls).toHaveLength(1)
  expect(getSpaceData.mock.calls).toHaveLength(1)
  expect(setupLogging.mock.calls).toHaveLength(1)
  expect(downloadAssets.mock.calls).toHaveLength(1)
  expect(displayErrorLog.mock.calls).toHaveLength(1)
  expect(fs.access.mock.calls).toHaveLength(0)
  expect(mkdirp.mock.calls).toHaveLength(0)
  expect(bfj.write.mock.calls).toHaveLength(0)
  expect(writeErrorLogFile.mock.calls).toHaveLength(1)
})
