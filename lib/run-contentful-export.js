import createClients from 'contentful-batch-libs/utils/create-clients'
import fs from 'fs'
import getFullSourceSpace from 'contentful-batch-libs/get/get-full-source-space'
import Promise from 'bluebird'
import jsonStringifySafe from 'json-stringify-safe'
var log = require('npmlog')

Promise.promisifyAll(fs)
export default function runContentfulExport (usageParams) {
  let {opts} = usageParams
  let exportToFile = true
  if (!opts) {
    exportToFile = false
    opts = {}
    opts.sourceSpace = opts.sourceSpace || usageParams.spaceId
    opts.sourceManagementToken = opts.sourceManagementToken || usageParams.managementToken
  }
  const clients = createClients(opts)
  return getFullSourceSpace({
    managementClient: clients.source.management,
    spaceId: clients.source.spaceId
  })
    .then((response) => {
      if (exportToFile) {
        const responseFile = `${opts.exportDir}/contentful-export-${clients.source.spaceId}-${Date.now()}.json`
        log.info('Writing the data to a json to file at : ' + responseFile)
        return fs.writeFile(responseFile, jsonStringifySafe(response))
      }
      return response
    })
    .catch((err) => {
      throw err
    })
}
