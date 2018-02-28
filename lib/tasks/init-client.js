import {createClient} from 'contentful-management'

import { logEmitter } from 'contentful-batch-libs/dist/logging'

function logHandler (level, data) {
  logEmitter.emit(level, data)
}

export default function initClient (opts) {
  const defaultOpts = {
    timeout: 10000,
    logHandler
  }
  const config = {
    ...defaultOpts,
    ...opts
  }
  return createClient(config)
}
