import jwt from 'jsonwebtoken'

const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000
const assetKeyCache = new Map()

/**
 * @param {string} host - The Contentful API host.
 * @param {string} accessToken - The access token for the Contentful API.
 * @param {string} spaceId - The ID of the Contentful space.
 * @param {string} environmentId - The ID of the Contentful environment.
 * @param {number} expiresAtMs - The expiration time in milliseconds.
 * @param {import('axios').AxiosInstance} httpClient - The HTTP client to use for requests.
 */
function createAssetKey (host, accessToken, spaceId, environmentId, expiresAtMs, httpClient) {
  return httpClient(`https://${host}/spaces/${spaceId}/environments/${environmentId}/asset_keys`, {
    method: 'POST',
    data: JSON.stringify({
      expiresAt: Math.floor(expiresAtMs / 1000) // in seconds
    }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
}

export const shouldCreateNewCacheItem = (cacheItem, currentExpiresAtMs) =>
  !cacheItem || currentExpiresAtMs - cacheItem.expiresAtMs > SIX_HOURS_IN_MS

async function createCachedAssetKey (host, accessToken, spaceId, environmentId, minExpiresAtMs, httpClient) {
  const cacheKey = `${host}:${spaceId}:${environmentId}`
  let cacheItem = assetKeyCache.get(cacheKey)

  if (shouldCreateNewCacheItem(cacheItem, minExpiresAtMs)) {
    const expiresAtMs = calculateExpiryTimestamp()

    if (minExpiresAtMs > expiresAtMs) {
      throw new Error(`Cannot fetch an asset key so far in the future: ${minExpiresAtMs} > ${expiresAtMs}`)
    }

    try {
      const assetKeyResponse = await createAssetKey(host, accessToken, spaceId, environmentId, expiresAtMs, httpClient)
      cacheItem = { expiresAtMs, result: assetKeyResponse.data }
      assetKeyCache.set(cacheKey, cacheItem)
    } catch (err) {
      // If we encounter an error, make sure to clear the cache item if this is the most recent fetch.
      const curCacheItem = assetKeyCache.get(cacheKey)
      if (curCacheItem === cacheItem) {
        assetKeyCache.delete(cacheKey)
      }

      return Promise.reject(err)
    }
  }

  return cacheItem.result
}

function generateSignedToken (secret, urlWithoutQueryParams, expiresAtMs) {
  // Convert expiresAtMs to seconds, if defined
  const exp = expiresAtMs ? Math.floor(expiresAtMs / 1000) : undefined
  return jwt.sign({
    sub: urlWithoutQueryParams,
    exp
  }, secret, { algorithm: 'HS256' })
}

function generateSignedUrl (policy, secret, url, expiresAtMs) {
  const parsedUrl = new URL(url)

  const urlWithoutQueryParams = parsedUrl.origin + parsedUrl.pathname
  const token = generateSignedToken(secret, urlWithoutQueryParams, expiresAtMs)

  parsedUrl.searchParams.set('token', token)
  parsedUrl.searchParams.set('policy', policy)

  return parsedUrl.toString()
}

export function isEmbargoedAsset (url) {
  const pattern = /((images)|(assets)|(downloads)|(videos))\.secure\./
  return pattern.test(url)
}

export function calculateExpiryTimestamp () {
  return Date.now() + SIX_HOURS_IN_MS
}

/**
 * @param {string} host - The Contentful API host.
 * @param {string} accessToken - The access token for the Contentful API.
 * @param {string} spaceId - The ID of the Contentful space.
 * @param {string} environmentId - The ID of the Contentful environment.
 * @param {string} url - The URL to be signed.
 * @param {number} expiresAtMs - The expiration time in milliseconds.
 * @param {import('axios').AxiosInstance} httpClient - The HTTP client to use for requests.
 */
export function signUrl (host, accessToken, spaceId, environmentId, url, expiresAtMs, httpClient) {
  // handle urls without protocol
  if (url.startsWith('//')) {
    url = 'https:' + url
  }

  return createCachedAssetKey(host, accessToken, spaceId, environmentId, expiresAtMs, httpClient)
    .then(({ policy, secret }) => generateSignedUrl(policy, secret, url, expiresAtMs))
}
