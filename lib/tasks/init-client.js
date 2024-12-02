import { createClient as createCdaClient } from 'contentful'
import { logEmitter } from 'contentful-batch-libs'
import { createClient as createCmaClient } from 'contentful-management'

function logHandler (level, data) {
  logEmitter.emit(level, data)
}

export default function initClient (opts, useCda = false) {
  const defaultOpts = {
    timeout: 10000,
    logHandler
  }
  const config = {
    ...defaultOpts,
    ...opts
  }
  if (useCda) {
    const cdaConfig = {
      ...config,
      space: config.spaceId,
      accessToken: config.deliveryToken,
      environment: config.environmentId,
      host: config.hostDelivery
    }
    return createCdaClient(cdaConfig).withoutLinkResolution
  }
  return createCmaClient(config)
}
