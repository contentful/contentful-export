import path from 'path'

import Promise from 'bluebird'
import figures from 'figures'
import fs from 'fs-extra'
import request from 'request'

import getEntityName from 'contentful-batch-libs/dist/get-entity-name'

function downloadAsset (url, directory) {
  return new Promise(function (resolve, reject) {
    // build local file path from the url for the download
    const urlParts = url.split('//')

    const localFile = path.join(directory, urlParts[urlParts.length - 1])

    // ensure directory exists and create file stream
    fs.mkdirsSync(path.dirname(localFile))
    const file = fs.createWriteStream(localFile)

    // handle urls without protocol
    if (url.startsWith('//')) {
      url = 'https:' + url
    }

    // download asset
    const assetRequest = request.get(url)

    // pipe response content to file
    assetRequest
      .on('error', (err) => {
        reject(err)
      })
      .on('response', (response) => {
        if (response.statusCode >= 400) {
          reject(new Error('error response status: ' + response.statusCode))
        }
      })
      .pipe(file)
      .on('finish', () => resolve(localFile))
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
        const url = asset.fields.file[locale].url
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
