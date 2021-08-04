import rp from 'request-promise'
import jwt from 'jsonwebtoken'

const assetKeyCache = new Map()

function createAssetKey(host, accessToken, spaceId, environmentId, expiresAtMs) {
  const options = {
    method: 'POST',
    uri: `https://${host}/spaces/${spaceId}/environments/${environmentId}/asset_keys`,
    body: {
        expiresAt: Math.floor(expiresAtMs / 1000) // in seconds
    },
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    json: true
  }

  return rp(options)
}

function createCachedAssetKey(host, accessToken, spaceId, environmentId, minExpiresAtMs) {
  const cacheKey = `${host}:${spaceId}:${environmentId}`
  let cacheItem = assetKeyCache.get(cacheKey)

  if (!cacheItem || cacheItem.expiresAtMs < minExpiresAtMs) {
      const expiresAtMs = createAssetKeyValidity()

      if (minExpiresAtMs > expiresAtMs) {
        throw new Error(`Cannot fetch an asset key so far in the future: ${minExpiresAtMs} > ${expiresAtMs}`)
      }

      const promise = createAssetKey(
          host,
          accessToken,
          spaceId,
          environmentId,
          expiresAtMs
      ).catch(err => {
          // If we encounter an error, make sure to clear the cache item if this is the most recent fetch.
          const curCacheItem = assetKeyCache.get(cacheKey)
          if (curCacheItem === cacheItem) {
              assetKeyCache.delete(cacheKey)
          }
          return Promise.reject(err)
      })
      cacheItem = { expiresAtMs, promise }
      assetKeyCache.set(cacheKey, cacheItem)
  }

  return cacheItem.promise
}

function generateSignedToken(secret, urlWithoutQueryParams, expiresAtMs) {
  // Convert expiresAtMs to seconds, if defined
  const exp = expiresAtMs ? Math.floor(expiresAtMs / 1000) : undefined
  return jwt.sign({
      sub: urlWithoutQueryParams,
      exp,
  }, secret, { algorithm: 'HS256' })
}

function generateSignedUrl(policy, secret, url, expiresAtMs) {
  const parsedUrl = new URL(url)

  const urlWithoutQueryParams = parsedUrl.origin + parsedUrl.pathname
  const token = generateSignedToken(secret, urlWithoutQueryParams, expiresAtMs)

  parsedUrl.searchParams.set('token', token)
  parsedUrl.searchParams.set('policy', policy)

  return parsedUrl.toString()
}

export function isEmbargoedAsset(url) {
  const pattern = /((images)|(assets)|(downloads)|(videos))\.secure\./
  return pattern.test(url)
}

export function createAssetKeyValidity() {
  // Create a future timestamp with maximum validity, 48h
  return Date.now() + 48 * 60 * 60 * 1000
}

export function signUrl(host, accessToken, spaceId, environmentId, url, expiresAtMs) {
  // handle urls without protocol
  if (url.startsWith('//')) {
    url = 'https:' + url
  }

  return createCachedAssetKey(host, accessToken, spaceId, environmentId, expiresAtMs)
  .then(({policy, secret}) => generateSignedUrl(policy, secret, url, expiresAtMs))
}