import {get} from 'lodash/object'
import {partialRight} from 'lodash/function'
import log from 'npmlog'
import fs from 'fs'
import errorBuffer from 'contentful-batch-libs/utils/error-buffer'

export default function dumpErrorBuffer (params, message = 'Additional errors were found') {
  const {sourceSpace, errorLogFile} = params
  const loggedErrors = errorBuffer.drain()
  if (loggedErrors.length > 0) {
    const errorOutput = {
      additionalInfo: {}
    }
    errorOutput.errors = loggedErrors.map(partialRight(logErrorsWithAppLinks, sourceSpace))
    fs.writeFileSync(errorLogFile, JSON.stringify(errorOutput, null, '  '))
    log.warn(message)
    log.warn(`Check ${errorLogFile} for details.`)
  }
}

function logErrorsWithAppLinks (err, idx, loggedErrors, sourceSpace) {
  const parsedError = JSON.parse(err.message)
  const requestUri = get(parsedError, 'request.url')
  if (requestUri) {
    parsedError.webAppUrl = parseEntityUrl(sourceSpace, requestUri)
  }
  return parsedError
}

function parseEntityUrl (sourceSpace, destinationSpace, url) {
  return url.replace(/api.contentful/, 'app.contentful')
            .replace(/:443/, '')
            .replace(sourceSpace)
            .split('/').splice(0, 7).join('/')
}
