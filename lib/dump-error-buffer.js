import log from 'npmlog'
import fs from 'fs'
import errorBuffer from 'contentful-batch-libs/utils/error-buffer'

export default function dumpErrorBuffer (params, message = 'Additional errors were found') {
  const {errorLogFile} = params
  const loggedErrors = errorBuffer.drain()
  if (loggedErrors.length > 0) {
    const errorOutput = {
      additionalInfo: {}
    }
    fs.writeFileSync(errorLogFile, JSON.stringify(errorOutput, null, '  '))
    log.warn(message)
    log.warn(`Check ${errorLogFile} for details.`)
  }
}
