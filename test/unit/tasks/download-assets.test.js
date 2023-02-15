import { promises as fs, rmSync } from 'fs'
import { tmpdir } from 'os'
import { resolve } from 'path'

import nock from 'nock'

import downloadAssets from '../../../lib/tasks/download-assets'

const tmpDirectory = resolve(tmpdir(), 'contentful-import-test')

const BASE_PATH = '//images.contentful.com'
const BASE_PATH_SECURE = '//images.secure.contentful.com'
const EXISTING_ASSET_URL = '/kq9lln4hyr8s/2MTd2wBirYikEYkIIc0YSw/7aa4c06f3054996e45bb3f13964cb254/rocka-nutrition.png'
const EMBARGOED_ASSET_URL = '/kq9lln4hyr8s/2MTd2wBirYikEYkIIc0YSw/7aa4c06f3054996e45bb3f13964cb254/space-dog.png'
const NON_EXISTING_URL = '/does-not-exist.png'

const API_HOST = 'api.contentful.com'
const SPACE_ID = 'kq9lln4hyr8s'
const ACCESS_TOKEN = 'abc'
const ENVIRONMENT_ID = 'master'
const POLICY = 'eyJhbG.eyJMDIyfQ.SflKx5c'
const SECRET = 's3cr3t'

let taskProxy
let output

nock(`https:${BASE_PATH}`)
  .get(EXISTING_ASSET_URL)
  .times(6)
  .reply(200)

nock(`https:${BASE_PATH}`)
  .get(NON_EXISTING_URL)
  .reply(404)

// Mock downloading assets using signed URLs
nock(`https:${BASE_PATH_SECURE}`)
  .get(EMBARGOED_ASSET_URL)
  .query({ policy: POLICY, token: /.+/i })
  .times(2)
  .reply(200)

// Mock asset-key creation for embargoed assets
nock(`https://${API_HOST}`)
  .post(`/spaces/${SPACE_ID}/environments/${ENVIRONMENT_ID}/asset_keys`, {
    expiresAt: /.+/i
  })
  .times(1)
  .reply(200, { policy: POLICY, secret: SECRET })

function getAssets ({ existing = 0, nonExisting = 0, missingUrl = 0, embargoed = 0 } = {}) {
  const existingUrl = `${BASE_PATH}${EXISTING_ASSET_URL}`
  const embargoedUrl = `${BASE_PATH_SECURE}${EMBARGOED_ASSET_URL}`
  const nonExistingUrl = `${BASE_PATH}${NON_EXISTING_URL}`
  const assets = []
  for (let i = 0; i < nonExisting; i++) {
    assets.push({
      sys: {
        id: `Non existing asset ${i}`
      },
      fields: {
        file: {
          'en-US': {
            url: nonExistingUrl,
            upload: '//file-stack-url-do-not-use-me.png'
          },
          'de-DE': {
            url: nonExistingUrl,
            upload: '//file-stack-url-do-not-use-me.png'
          }
        }
      }
    })
  }
  for (let i = 0; i < existing; i++) {
    assets.push({
      sys: {
        id: `existing asset ${i}`
      },
      fields: {
        file: {
          'en-US': {
            url: existingUrl,
            upload: '//file-stack-url-do-not-use-me.png'
          },
          'de-DE': {
            url: existingUrl,
            upload: '//file-stack-url-do-not-use-me.png'
          }
        }
      }
    })
  }
  for (let i = 0; i < embargoed; i++) {
    assets.push({
      sys: {
        id: `embargoed asset ${i}`
      },
      fields: {
        file: {
          'en-US': {
            url: embargoedUrl,
            upload: '//file-stack-url-do-not-use-me.png'
          },
          'de-DE': {
            url: embargoedUrl,
            upload: '//file-stack-url-do-not-use-me.png'
          }
        }
      }
    })
  }
  for (let i = 0; i < missingUrl; i++) {
    assets.push({
      sys: {
        id: `missing file url ${i}`
      },
      fields: {
        file: {
          'en-US': {
            upload: '//file-stack-url-do-not-use-me.png'
          },
          'de-DE': {
            upload: '//file-stack-url-do-not-use-me.png'
          }
        }
      }
    })
  }
  return assets
}

beforeEach(() => {
  output = jest.fn()
  taskProxy = new Proxy({}, {
    set: (obj, prop, value) => {
      if (prop === 'output') {
        output(value)
        return value
      }
      throw new Error(`It should not access task property ${prop} (value: ${value})`)
    }
  })
})
beforeAll(async () => {
  await fs.mkdir(tmpDirectory, { recursive: true })
})

afterAll(() => {
  // Couldn't get `fs.promises.rm` to work without permissions issues
  rmSync(tmpDirectory, { recursive: true, force: true })

  if (!nock.isDone()) {
    throw new Error(`pending mocks: ${nock.pendingMocks().join(', ')}`)
  }

  nock.cleanAll()
  nock.restore()
})

test('Downloads assets and properly counts failed attempts', () => {
  const task = downloadAssets({
    exportDir: tmpDirectory
  })
  const ctx = {
    data: {
      assets: [
        ...getAssets({ existing: 1, nonExisting: 1 }),
        {
          sys: {
            id: 'corrupt asset [warning]'
          },
          fields: {}
        }
      ]
    }
  }

  return task(ctx, taskProxy)
    .then(() => {
      expect(ctx.assetDownloads).toEqual({
        successCount: 2,
        warningCount: 1,
        errorCount: 2
      })
      expect(output.mock.calls).toHaveLength(5)
    })
})

test('Downloads embargoed assets', () => {
  const task = downloadAssets({
    exportDir: tmpDirectory,
    host: API_HOST,
    accessToken: ACCESS_TOKEN,
    spaceId: SPACE_ID,
    environmentId: ENVIRONMENT_ID
  })
  const ctx = {
    data: {
      assets: [
        ...getAssets({ embargoed: 1 })
      ]
    }
  }

  return task(ctx, taskProxy)
    .then(() => {
      expect(ctx.assetDownloads).toEqual({
        successCount: 2,
        warningCount: 0,
        errorCount: 0
      })
      expect(output.mock.calls).toHaveLength(2)
    })
})

test('it doesn\'t use fileStack url as fallback for the file url and throws a warning output', () => {
  const task = downloadAssets({
    exportDir: tmpDirectory
  })
  const ctx = {
    data: {
      assets: [
        ...getAssets({ existing: 2, missingUrl: 1 })
      ]
    }
  }

  return task(ctx, taskProxy)
    .then(() => {
      expect(ctx.assetDownloads).toEqual({
        successCount: 4,
        warningCount: 0,
        errorCount: 2
      })
      expect(output.mock.calls).toHaveLength(6)

      const missingUrlsOutputCount = output.mock.calls.filter(call =>
        call[0]?.endsWith('asset.fields.file[en-US].url') ||
          call[0]?.endsWith('asset.fields.file[de-DE].url'))

      expect(missingUrlsOutputCount).toHaveLength(2)
    })
})
