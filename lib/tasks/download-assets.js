import path from 'path'

import Promise from 'bluebird'
import figures from 'figures'
import fs from 'fs-extra'
import request from 'request'
import { calculateExpiryTimestamp, isEmbargoedAsset, signUrl } from '../utils/embargoedAssets'
import getEntityName from 'contentful-batch-libs/dist/get-entity-name'

function downloadAsset ({ url, directory }) {
  return new Promise(function (resolve, reject) {
    // handle urls without protocol
    if (url.startsWith('//')) {
      url = 'https:' + url
    }

    // build local file path from the url for the download
    const parsedUrl = new URL(url)
    const localFile = path.join(directory, parsedUrl.host, parsedUrl.pathname)

    // ensure directory exists and create file stream
    fs.mkdirsSync(path.dirname(localFile))
    const file = fs.createWriteStream(localFile)

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
        if (!url) {
          task.output = `${figures.cross} asset '${getEntityName(asset)}' doesn't contain an url in path asset.fields.file[${locale}].url`
          errorCount++

          return Promise.resolve()
        }

        let startingPromise = Promise.resolve({ url, directory: options.exportDir })

        if (isEmbargoedAsset(url)) {
          const { host, accessToken, spaceId, environmentId } = options
          const expiresAtMs = calculateExpiryTimestamp()

          startingPromise = signUrl(host, accessToken, spaceId, environmentId, url, expiresAtMs)
            .then((signedUrl) => ({ url: signedUrl, directory: options.exportDir }))
        }

        return startingPromise
          .then(downloadAsset)
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
