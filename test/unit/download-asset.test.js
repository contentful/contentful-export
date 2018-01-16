import path from 'path'

import fs from 'fs-extra'

import downloadAsset from '../../lib/download-asset'

var tmpDirectory = path.join(__dirname, 'tmp')

beforeAll(() => {
  fs.mkdirsSync(tmpDirectory)
})

afterAll(() => {
  fs.removeSync(tmpDirectory)
})

test('Download asset successfully', () => {
  const imgUrl = '//images.contentful.com/kq9lln4hyr8s/2MTd2wBirYikEYkIIc0YSw/7aa4c06f3054996e45bb3f13964cb254/rocka-nutrition.png'
  const destPath = path.resolve(tmpDirectory + imgUrl)
  return downloadAsset(imgUrl, tmpDirectory)
    .then((file) => {
      expect(file).toBe(destPath)
      // test that file has has been downloaded
      // by checking if access throws no exception
      expect(function () {
        fs.accessSync(destPath)
      }).not.toThrow()
    })
})

test('Download fails', () => {
  return downloadAsset(
    '//images.contentful.com/does-not-exist.png',
    tmpDirectory
  )
    .then(() => {
      throw new Error('Should not succeed')
    })
    .catch((error) => {
      expect(error.message).toBe('error response status: 404')
    })
})
