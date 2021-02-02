import { tmpdir } from 'os'
import { resolve } from 'path'

import nock from 'nock'
import fs from 'fs-extra'

import downloadAssets from '../../../lib/tasks/download-assets'

const tmpDirectory = resolve(tmpdir(), 'contentful-import-test')

nock('https://images.contentful.com')
  .get('/kq9lln4hyr8s/2MTd2wBirYikEYkIIc0YSw/7aa4c06f3054996e45bb3f13964cb254/rocka-nutrition.png')
  .times(2)
  .reply(200)

nock('https://images.contentful.com')
  .get('/does-not-exist.png')
  .reply(404)

beforeAll(() => {
  fs.mkdirsSync(tmpDirectory)
})

afterAll(() => {
  fs.removeSync(tmpDirectory)
})

test('Downloads assets and properly counts failed attempts', () => {
  const task = downloadAssets({
    exportDir: tmpDirectory
  })
  const output = jest.fn()
  const taskProxy = new Proxy({}, {
    set: (obj, prop, value) => {
      if (prop === 'output') {
        output(value)
        return value
      }
      throw new Error(`It should not access task property ${prop} (value: ${value})`)
    }
  })
  const ctx = {
    data: {
      assets: [
        {
          sys: {
            id: 'existing asset'
          },
          fields: {
            file: {
              'en-US': {
                url: '//images.contentful.com/kq9lln4hyr8s/2MTd2wBirYikEYkIIc0YSw/7aa4c06f3054996e45bb3f13964cb254/rocka-nutrition.png'
              },
              'de-DE': {
                upload: '//images.contentful.com/kq9lln4hyr8s/2MTd2wBirYikEYkIIc0YSw/7aa4c06f3054996e45bb3f13964cb254/rocka-nutrition.png'
              }
            }
          }
        },
        {
          sys: {
            id: 'non-existing asset'
          },
          fields: {
            file: {
              'en-US': {
                url: '//images.contentful.com/does-not-exist.png'
              }
            }
          }
        },
        {
          sys: {
            id: 'corrupt asset'
          },
          fields: {}
        }
      ]
    }
  }

  return task(ctx, taskProxy)
    .then(() => {
      expect(ctx.assetDownloads).toEqual({
        successCount: 1,
        warningCount: 1,
        errorCount: 2
      })
      expect(output.mock.calls).toHaveLength(4)
    })
})
