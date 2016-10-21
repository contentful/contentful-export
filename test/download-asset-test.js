import test from 'tape'
import downloadAsset from '../lib/download-asset'
import fs from 'fs-extra'
import path from 'path'
var tmpDirectory = path.join(__dirname, 'tmp')

test('Download asset', (t) => {
  fs.mkdirsSync(tmpDirectory)

  downloadAsset(
    '//images.contentful.com/kq9lln4hyr8s/2MTd2wBirYikEYkIIc0YSw/7aa4c06f3054996e45bb3f13964cb254/rocka-nutrition.png',
    tmpDirectory
  )
  // file should have been downloaded
  t.doesNotThrow(function () {
    fs.accessSync(tmpDirectory + '/images.contentful.com/kq9lln4hyr8s/2MTd2wBirYikEYkIIc0YSw/7aa4c06f3054996e45bb3f13964cb254/rocka-nutrition.png')
  })

  fs.removeSync(tmpDirectory)
  t.end()
})
