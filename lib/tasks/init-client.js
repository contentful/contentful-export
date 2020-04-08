import { createClient as createCmaClient } from 'contentful-management'
import { createClient as createCdaClient } from 'contentful'

import { logEmitter } from 'contentful-batch-libs/dist/logging'

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
      space: config.spaceId,
      accessToken: config.deliveryToken,
      environment: config.environmentId,
      resolveLinks: false
    }
    return createCdaClient(cdaConfig)
  }
  return createCmaClient(config)
}
