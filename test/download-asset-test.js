import test from 'tape'
import downloadAsset from '../lib/download-asset'
import fs from 'fs-extra'
import path from 'path'
var tmpDirectory = path.join(__dirname, 'tmp')

test('Download asset successfully', (t) => {
  fs.mkdirsSync(tmpDirectory)

  downloadAsset(
    '//images.contentful.com/kq9lln4hyr8s/2MTd2wBirYikEYkIIc0YSw/7aa4c06f3054996e45bb3f13964cb254/rocka-nutrition.png',
    tmpDirectory
  ).then((file) => {
    t.equal(file, tmpDirectory + '/images.contentful.com/kq9lln4hyr8s/2MTd2wBirYikEYkIIc0YSw/7aa4c06f3054996e45bb3f13964cb254/rocka-nutrition.png')
  })
  // test that file has has been downloaded
  // by checking if access throws no exception
  t.doesNotThrow(function () {
    fs.accessSync(tmpDirectory + '/images.contentful.com/kq9lln4hyr8s/2MTd2wBirYikEYkIIc0YSw/7aa4c06f3054996e45bb3f13964cb254/rocka-nutrition.png')
  })

  fs.removeSync(tmpDirectory)
  t.end()
})

test('Download fails', (t) => {
  fs.mkdirsSync(tmpDirectory)

  downloadAsset(
    '//images.contentful.com/does-not-exist.png',
    tmpDirectory
  ).catch((error) => {
    t.equal(error, 'error response status: 404')
  })

  fs.removeSync(tmpDirectory)
  t.end()
})
