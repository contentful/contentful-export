import { resolve } from 'path'

import bfj from 'bfj'
import fs from 'fs'
import mkdirp from 'mkdirp'

import {
  setupLogging,
  displayErrorLog,
  writeErrorLogFile
} from 'contentful-batch-libs/dist/logging'

import downloadAssets, { downloadAssetsMock } from '../../lib/tasks/download-assets'
import getSpaceData from '../../lib/tasks/get-space-data'
import initClient from '../../lib/tasks/init-client'
import runContentfulExport from '../../lib/index'

jest.mock('../../lib/tasks/download-assets', () => {
  const downloadAssetsMock = jest.fn((ctx) => {
    ctx.assetDownloads = {
      successCount: 3,
      warningCount: 2,
      errorCount: 1
    }
    return Promise.resolve()
  })
  const downloadAssets = jest.fn(() => downloadAssetsMock)
  downloadAssets.downloadAssetsMock = downloadAssetsMock
  return downloadAssets
})
jest.mock('../../lib/tasks/get-space-data', () => jest.fn(() => {
  const Listr = require('listr')
  return new Listr([
    {
      title: 'mocked get full source space',
      task: (ctx) => {
        ctx.data = {
          'contentTypes': [],
          'entries': [],
          'assets': [
            {
              sys: {
                id: 'someValidAsset'
              },
              fields: {
                file: {
                  'en-US': {
                    url: '//images.contentful.com/kq9lln4hyr8s/2MTd2wBirYikEYkIIc0YSw/7aa4c06f3054996e45bb3f13964cb254/rocka-nutrition.png'
                  }
                }
              }
            },
            {
              sys: {
                id: 'someBrokenAsset'
              },
              fields: {}
            }
          ],
          'locales': []
        }
      }
    }
  ])
}))
jest.mock('../../lib/tasks/init-client', () => jest.fn())
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
jest.mock('fs', () => ({
  access: jest.fn((path, cb) => cb())
}))
jest.mock('mkdirp', (path) => jest.fn())
jest.mock('bfj', () => ({
  write: jest.fn(() => Promise.resolve())
}))
jest.spyOn(global.console, 'log')

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
  downloadAssetsMock.mockClear()
  global.console.log.mockClear()
})

test('Runs Contentful Export with default config', () => {
  return runContentfulExport({
    errorLogFile: 'errorlogfile',
    spaceId: 'someSpaceId',
    managementToken: 'someManagementToken'
  })
    .then((returnedData) => {
      expect(initClient.mock.calls).toHaveLength(1)
      expect(getSpaceData.mock.calls).toHaveLength(1)
      expect(setupLogging.mock.calls).toHaveLength(1)
      expect(downloadAssets.mock.calls).toHaveLength(1)
      expect(downloadAssetsMock.mock.calls).toHaveLength(0)
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
})

test('Runs Contentful Export and downloads assets', () => {
  return runContentfulExport({
    errorLogFile: 'errorlogfile',
    spaceId: 'someSpaceId',
    managementToken: 'someManagementToken',
    downloadAssets: true
  })
    .then((returnedData) => {
      expect(initClient.mock.calls).toHaveLength(1)
      expect(getSpaceData.mock.calls).toHaveLength(1)
      expect(setupLogging.mock.calls).toHaveLength(1)
      expect(downloadAssets.mock.calls).toHaveLength(1)
      expect(downloadAssetsMock.mock.calls).toHaveLength(1)
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
})

test('Creates a valid and correct opts object', () => {
  const errorLogFile = 'errorlogfile'
  const exampleConfig = require('../../example-config.json')

  return runContentfulExport({
    errorLogFile,
    config: resolve(__dirname, '..', '..', 'example-config.json')
  })
    .then(() => {
      expect(initClient.mock.calls[0][0].skipContentModel).toBeFalsy()
      expect(initClient.mock.calls[0][0].skipEditorInterfaces).toBeFalsy()
      expect(initClient.mock.calls[0][0].errorLogFile).toBe(resolve(process.cwd(), errorLogFile))
      expect(initClient.mock.calls[0][0].spaceId).toBe(exampleConfig.spaceId)
      expect(initClient.mock.calls).toHaveLength(1)
      expect(getSpaceData.mock.calls).toHaveLength(1)
      expect(setupLogging.mock.calls).toHaveLength(1)
      expect(downloadAssets.mock.calls).toHaveLength(1)
      expect(downloadAssetsMock.mock.calls).toHaveLength(0)
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
})

test('Run Contentful export fails due to rejection', () => {
  const rejectError = new Error()
  rejectError.request = {uri: 'erroruri'}
  getSpaceData.mockImplementation(() => Promise.reject(rejectError))

  return runContentfulExport({
    errorLogFile: 'errorlogfile',
    spaceId: 'someSpaceId',
    managementToken: 'someManagementToken'
  })
    .then(() => {
      throw new Error('should not resolve')
    })
    .catch(() => {
      expect(initClient.mock.calls).toHaveLength(1)
      expect(getSpaceData.mock.calls).toHaveLength(1)
      expect(setupLogging.mock.calls).toHaveLength(1)
      expect(downloadAssets.mock.calls).toHaveLength(1)
      expect(downloadAssetsMock.mock.calls).toHaveLength(0)
      expect(displayErrorLog.mock.calls).toHaveLength(1)
      expect(fs.access.mock.calls).toHaveLength(0)
      expect(mkdirp.mock.calls).toHaveLength(0)
      expect(bfj.write.mock.calls).toHaveLength(0)
      expect(writeErrorLogFile.mock.calls).toHaveLength(1)
    })
})
