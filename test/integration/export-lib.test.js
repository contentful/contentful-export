import { join } from 'path'

import mkdirp from 'mkdirp'
import rimraf from 'rimraf'

import runContentfulExport from '../../dist/index'

jest.setTimeout(15000)

const tmpFolder = join(__dirname, 'tmp-lib')
const spaceId = process.env.EXPORT_SPACE_ID
const managementToken = process.env.MANAGEMENT_TOKEN
const deliveryToken = process.env.DELIVERY_TOKEN

beforeAll(() => {
  mkdirp.sync(tmpFolder)
})

afterAll(() => {
  rimraf.sync(tmpFolder)
})

test('It should export space when used as a library', () => {
  return runContentfulExport({ spaceId, managementToken, useVerboseRenderer: true, saveFile: true, exportDir: tmpFolder })
    .catch((multierror) => {
      const errors = multierror.errors.filter((error) => Object.prototype.hasOwnProperty.call(error, 'error'))
      expect(errors).toHaveLength(0)
    })
    .then((content) => {
      expect(content).toBeTruthy()
      expect(content.contentTypes).toHaveLength(2)
      expect(content.editorInterfaces).toHaveLength(2)
      expect(content.entries).toHaveLength(4)
      expect(content.assets).toHaveLength(4)
      expect(content.locales).toHaveLength(1)
      expect(content.tags).toHaveLength(3)
      expect(content.webhooks).toHaveLength(0)
      expect(content.roles).toHaveLength(7)
      // make sure entries are delivered from CMA
      expect(content.entries[0].sys).toHaveProperty('publishedVersion')
    })
})

test.only('It should export environment when used as a library', () => {
  return runContentfulExport({ spaceId, environmentId: 'staging', managementToken, saveFile: false, exportDir: tmpFolder })
    .catch((multierror) => {
      const errors = multierror.errors.filter((error) => Object.prototype.hasOwnProperty.call(error, 'error'))
      expect(errors).toHaveLength(0)
    })
    .then((content) => {
      expect(content).toBeTruthy()
      expect(content.contentTypes).toHaveLength(2)
      expect(content.editorInterfaces).toHaveLength(2)
      expect(content.entries).toHaveLength(4)
      expect(content.assets).toHaveLength(4)
      expect(content.locales).toHaveLength(1)
      expect(content.tags).toHaveLength(1)
      expect(content).not.toHaveProperty('webhooks')
      expect(content).not.toHaveProperty('roles')
    })
})

test.only('It should export space when used as a library, with deliveryToken', () => {
  return runContentfulExport({ spaceId, managementToken, deliveryToken, saveFile: false, exportDir: tmpFolder })
    .catch((multierror) => {
      const errors = multierror.errors.filter((error) => Object.prototype.hasOwnProperty.call(error, 'error'))
      expect(errors).toHaveLength(0)
    })
    .then((content) => {
      expect(content).toBeTruthy()
      expect(content.contentTypes).toHaveLength(2)
      expect(content.editorInterfaces).toHaveLength(2)
      expect(content.entries).toHaveLength(4)
      expect(content.assets).toHaveLength(4)
      expect(content.locales).toHaveLength(1)
      expect(content.tags).toBeUndefined()
      expect(content.webhooks).toHaveLength(0)
      expect(content.roles).toHaveLength(7)
      // entries returned from CDN don't have this property
      expect(content.entries[0].sys).not.toHaveProperty('publishedVersion')
    })
})
