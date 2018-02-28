import path from 'path'

import Promise from 'bluebird'
import figures from 'figures'
import fs from 'fs-extra'
import request from 'request'

import getEntityName from 'contentful-batch-libs/dist/get-entity-name'

function downloadAsset (url, directory) {
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

export default function downloadAssets (options) {
  return (ctx, task) => {
    let successCount = 0
    let warningCount = 0
    let errorCount = 0

    return Promise.map(ctx.data.assets, (asset) => {
      if (!asset.fields.file) {
        task.output = `${figures.warning} asset ${getEntityName(asset)} has no file(s)`
        warningCount++
        return
      }
      const locales = Object.keys(asset.fields.file)
      return Promise.mapSeries(locales, (locale) => {
        const url = asset.fields.file[locale].url || asset.fields.file[locale].upload
        return downloadAsset(url, options.exportDir)
          .then((downLoadedFile) => {
            task.output = `${figures.tick} downloaded ${getEntityName(downLoadedFile)} (${url})`
            successCount++
          })
          .catch((error) => {
            task.output = `${figures.cross} error downloading ${url}: ${error.message}`
            errorCount++
          })
      })
    }, {
      concurrency: 6
    })
      .then(() => {
        ctx.assetDownloads = {
          successCount,
          warningCount,
          errorCount
        }
      })
  }
}
