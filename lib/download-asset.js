import fs from 'fs-extra'
var request = require('request')
var path = require('path')
var log = require('npmlog')

export default function downloadAsset (url, directory) {
  // build local file path from the url for the download
  var urlParts = url.split('//')
  var localFile = path.join(directory, urlParts[urlParts.length - 1])

  // ensure directory exists
  fs.mkdirsSync(path.dirname(localFile))
  var file = fs.createWriteStream(localFile)

  // handle urls without protocol
  if (url.startsWith('//')) {
    url = 'http:' + url
  }

  // download asset and pipe it to file
  var assetRequest = request.get(url)
  assetRequest.pipe(file)

  file.on('finish', function () {
    file.close()
  })

  log.info('-> ' + localFile)
}
