import { promises as fs, rmSync } from 'fs'
import { tmpdir } from 'os'
import { resolve } from 'path'

import nock from 'nock'

import downloadAssets from '../../../lib/tasks/download-assets'

const tmpDirectory = resolve(tmpdir(), 'contentful-import-test')

const BASE_PATH = '//images.contentful.com'
const BASE_PATH_SECURE = '//images.secure.contentful.com'
const ASSET_PATH = '/kq9lln4hyr8s/2MTd2wBirYikEYkIIc0YSw/7aa4c06f3054996e45bb3f13964cb254'
const EXISTING_ASSET_FILENAME = 'rocka-nutrition.png'
const EXISTING_ASSET_URL = `${ASSET_PATH}/${EXISTING_ASSET_FILENAME}`
const EMBARGOED_ASSET_FILENAME = 'space-dog.png'
const EMBARGOED_ASSET_URL = `${ASSET_PATH}/${EMBARGOED_ASSET_FILENAME}`
const NON_EXISTING_URL = '/does-not-exist.png'
const UNICODE_SHORT_FILENAME = '测试文件.jpg'
const UNICODE_SHORT_URL = `${ASSET_PATH}/${encodeURIComponent(UNICODE_SHORT_FILENAME)}`
const UNICODE_LONG_FILENAME = `${'测试文件'.repeat(25)}.jpg`
const UNICODE_LONG_URL = `${ASSET_PATH}/${encodeURIComponent(UNICODE_LONG_FILENAME)}`
const DIFFERENT_FILENAME = 'different filename.jpg'
const UPLOAD_URL = '//file-stack-url-do-not-use-me.png'

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
  .times(8)
  .reply(200)

nock(`https:${BASE_PATH}`)
  .get(NON_EXISTING_URL)
  .reply(404)

nock(`https:${BASE_PATH}`)
  .get(UNICODE_SHORT_URL)
  .times(2)
  .reply(200)

nock(`https:${BASE_PATH}`)
  .get(UNICODE_LONG_URL)
  .times(2)
  .reply(200)

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

function getAssets ({ existing = 0, nonExisting = 0, missingUrl = 0, embargoed = 0, unicodeShort = 0, unicodeLong = 0, differentFilename = 0 } = {}) {
  const existingUrl = `${BASE_PATH}${EXISTING_ASSET_URL}`
  const embargoedUrl = `${BASE_PATH_SECURE}${EMBARGOED_ASSET_URL}`
  const nonExistingUrl = `${BASE_PATH}${NON_EXISTING_URL}`
  const unicodeShortUrl = `${BASE_PATH}${UNICODE_SHORT_URL}`
  const unicodeLongUrl = `${BASE_PATH}${UNICODE_LONG_URL}`
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
            fileName: NON_EXISTING_URL,
            upload: UPLOAD_URL
          },
          'de-DE': {
            url: nonExistingUrl,
            fileName: NON_EXISTING_URL,
            upload: UPLOAD_URL
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
            fileName: EXISTING_ASSET_FILENAME,
            upload: UPLOAD_URL
          },
          'de-DE': {
            url: existingUrl,
            fileName: EXISTING_ASSET_FILENAME,
            upload: UPLOAD_URL
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
            fileName: EMBARGOED_ASSET_FILENAME,
            upload: UPLOAD_URL
          },
          'de-DE': {
            url: embargoedUrl,
            fileName: EMBARGOED_ASSET_FILENAME,
            upload: UPLOAD_URL
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
            upload: UPLOAD_URL,
            fileName: DIFFERENT_FILENAME
          },
          'de-DE': {
            upload: UPLOAD_URL,
            fileName: DIFFERENT_FILENAME
          }
        }
      }
    })
  }
  for (let i = 0; i < unicodeShort; i++) {
    assets.push({
      sys: {
        id: `unicode short asset ${i}`
      },
      fields: {
        file: {
          'en-US': {
            url: unicodeShortUrl,
            fileName: UNICODE_SHORT_FILENAME,
            upload: UPLOAD_URL
          },
          'de-DE': {
            url: unicodeShortUrl,
            fileName: UNICODE_SHORT_FILENAME,
            upload: UPLOAD_URL
          }
        }
      }
    })
  }
  for (let i = 0; i < unicodeLong; i++) {
    assets.push({
      sys: {
        id: `unicode long asset ${i}`
      },
      fields: {
        file: {
          'en-US': {
            url: unicodeLongUrl,
            fileName: UNICODE_LONG_FILENAME,
            upload: UPLOAD_URL
          },
          'de-DE': {
            url: unicodeLongUrl,
            fileName: UNICODE_LONG_FILENAME,
            upload: UPLOAD_URL
          }
        }
      }
    })
  }
  for (let i = 0; i < differentFilename; i++) {
    assets.push({
      sys: {
        id: `different filename asset ${i}`
      },
      fields: {
        file: {
          'en-US': {
            url: existingUrl,
            fileName: DIFFERENT_FILENAME,
            upload: UPLOAD_URL
          },
          'de-DE': {
            url: existingUrl,
            fileName: DIFFERENT_FILENAME,
            upload: UPLOAD_URL
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
      throw new Error(`It should not access task property ${String(prop)} (value: ${value})`)
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

test('Downloads assets with short Unicode filenames', () => {
  const task = downloadAssets({
    exportDir: tmpDirectory
  })
  const ctx = {
    data: {
      assets: [
        ...getAssets({ unicodeShort: 1 })
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

      const unicodeShortAsset = ctx.data.assets.find(asset => asset.sys.id === 'unicode short asset 0')
      expect(unicodeShortAsset.fields.file['en-US'].fileName).toBe(UNICODE_SHORT_FILENAME)
      expect(unicodeShortAsset.fields.file['de-DE'].fileName).toBe(UNICODE_SHORT_FILENAME)
    })
})

test('Downloads assets with long Unicode filenames', () => {
  const task = downloadAssets({
    exportDir: tmpDirectory
  })
  const ctx = {
    data: {
      assets: [
        ...getAssets({ unicodeLong: 1 })
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

      const unicodeLongAsset = ctx.data.assets.find(asset => asset.sys.id === 'unicode long asset 0')
      expect(unicodeLongAsset.fields.file['en-US'].fileName).toBe(UNICODE_LONG_FILENAME)
      expect(unicodeLongAsset.fields.file['de-DE'].fileName).toBe(UNICODE_LONG_FILENAME)
    })
})

test('Downloads assets with different filename than URL path', () => {
  const task = downloadAssets({
    exportDir: tmpDirectory
  })
  const ctx = {
    data: {
      assets: [
        ...getAssets({ differentFilename: 1 })
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

      const differentFilenameAsset = ctx.data.assets.find(asset => asset.sys.id === 'different filename asset 0')
      expect(differentFilenameAsset.fields.file['en-US'].fileName).toBe(DIFFERENT_FILENAME)
      expect(differentFilenameAsset.fields.file['en-US'].url).toBe(`${BASE_PATH}${EXISTING_ASSET_URL}`)
      expect(differentFilenameAsset.fields.file['de-DE'].fileName).toBe(DIFFERENT_FILENAME)
      expect(differentFilenameAsset.fields.file['de-DE'].url).toBe(`${BASE_PATH}${EXISTING_ASSET_URL}`)
    })
})
