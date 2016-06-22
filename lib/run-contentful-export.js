import createClients from 'contentful-batch-libs/utils/create-clients'
import dumpErrorBuffer from './dump-error-buffer'
import fs from 'fs'
import getFullSourceSpace from 'contentful-batch-libs/get/get-full-source-space'
import Promise from 'bluebird'
import jsonStringifySafe from 'json-stringify-safe'
var log = require('npmlog')

Promise.promisifyAll(fs)
export default function runContentfulExport (usageParams) {
  const {opts, errorLogFile} = usageParams
  const clients = createClients(opts)
  return getFullSourceSpace({
    managementClient: clients.source.management,
    spaceId: clients.source.spaceId
  })
  .then((response) => {
    const responseFile = `${opts.exportDir}/contentful-export-${clients.source.spaceId}-${Date.now()}.json`
    log.info('Writing the data to a json to file at : ' + responseFile)
    return fs.writeFile(responseFile, jsonStringifySafe(response))
  })
  .catch((err) => {
    dumpErrorBuffer({
      sourceSpace: opts.sourceSpace,
      errorLogFile: errorLogFile
    })
    throw err
  })
}
