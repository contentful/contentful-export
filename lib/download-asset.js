import fs from 'fs-extra'
var request = require('request')
var path = require('path')

export default function downloadAsset (url, directory) {
  return new Promise(function (resolve, reject) {
    // build local file path from the url for the download
    var urlParts = url.split('//')

    var localFile = path.join(directory, urlParts[urlParts.length - 1])

    // ensure directory exists and create file stream
    fs.mkdirsSync(path.dirname(localFile))
    var file = fs.createWriteStream(localFile)

    // handle urls without protocol
    if (url.startsWith('//')) {
      url = 'https:' + url
    }

    // download asset
    var assetRequest = request.get(url)
    assetRequest.on('response', (response) => {
      // handle error response
      if (response.statusCode >= 400) {
        file.end()
        reject(new Error('error response status: ' + response.statusCode))
        return
      }

      // pipe response content to file
      response.pipe(file)

      file.on('finish', function () {
        file.end()
        resolve(localFile)
      })
    })

    // handle request errors
    assetRequest.on('error', (error) => {
      file.end()
      reject(error)
    })
  })
}
