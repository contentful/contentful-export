import Promise from 'bluebird'
import { getEntityName } from 'contentful-batch-libs'
import figures from 'figures'
import { createWriteStream, promises as fs } from 'fs'
import path from 'path'
import { pipeline } from 'stream'
import { promisify } from 'util'
import { calculateExpiryTimestamp, isEmbargoedAsset, signUrl } from '../utils/embargoedAssets'
import axios from 'axios'

const streamPipeline = promisify(pipeline)

/**
 * @param {Object} options - The options for downloading the asset.
 * @param {string} options.url - The URL of the asset to download.
 * @param {string} options.directory - The directory where the asset should be saved.
 * @param {import('axios').AxiosInstance} options.httpClient - The HTTP client to use for downloading the asset.
 */
async function downloadAsset ({ url, directory, httpClient }) {
// handle urls without protocol
  if (url.startsWith('//')) {
    url = 'https:' + url
  }

  // build local file path from the url for the download
  const parsedUrl = new URL(url)
  const localFile = path.join(directory, parsedUrl.host, parsedUrl.pathname)

  // ensure directory exists and create file stream
  await fs.mkdir(path.dirname(localFile), { recursive: true })
  const file = createWriteStream(localFile)

  // download asset
  const assetRequest = await httpClient.get(url, { responseType: 'blob' })

  if (assetRequest.status < 200 || assetRequest.status >= 300) {
    throw new Error(`error response status: ${assetRequest.status}`)
  }

  // Wait for stream to be consumed before returning local file
  await streamPipeline(assetRequest.data, file)
  return localFile
}

export default function downloadAssets (options) {
  return (ctx, task) => {
    let successCount = 0
    let warningCount = 0
    let errorCount = 0

    const httpClient = axios.create({
      headers: options.headers,
      timeout: options.timeout,
      httpAgent: options.httpAgent,
      httpsAgent: options.httpsAgent,
      proxy: options.proxy
    })

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

        let startingPromise = Promise.resolve({ url, directory: options.exportDir, httpClient })

        if (isEmbargoedAsset(url)) {
          const { host, accessToken, spaceId, environmentId } = options
          const expiresAtMs = calculateExpiryTimestamp()

          startingPromise = signUrl(host, accessToken, spaceId, environmentId, url, expiresAtMs, httpClient)
            .then((signedUrl) => ({ url: signedUrl, directory: options.exportDir, httpClient }))
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
