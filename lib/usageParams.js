const yargs = require('yargs')
const log = require('npmlog')
const packageFile = require('../package')

const opts = yargs
  .version(packageFile.version || 'Version only available on installed package')
  .usage('Usage: $0 [options]')
  .option('space-id', {
    describe: 'ID of Space with source data',
    type: 'string',
    demand: true
  })
  .option('management-token', {
    describe: 'Management API token for the space to be exported.',
    type: 'string',
    demand: true
  })
  .option('export-dir', {
    describe: 'Defines the path for storing the export json file (default path is the current directory)',
    type: 'string'
  })
  .option('download-assets', {
    describe: 'With this flags assets will also be downloaded',
    type: 'boolean'
  })
  .option('max-allowed-limit', {
    describe: 'How many item per page per request default 1000',
    type: 'number'
  })
  .config('config', 'Configuration file with required values')
  .check(function (argv) {
    if (!argv.spaceId) {
      log.error('Please provide --space-id to be used to export \n' +
          'For more info See: https://www.npmjs.com/package/contentful-export'
      )
      process.exit(1)
    }
    if (!argv.managementToken) {
      log.error('Please provide --management-token to be used for export \n' +
          'For more info See: https://www.npmjs.com/package/contentful-export'
      )
      process.exit(1)
    }
    if (argv.includeDrafts && !argv.previewToken) {
      log.error('Please provide a preview API token to be able to get draft or set --include-drafts false')
      process.exit(1)
    }
    if (!argv.includeDrafts && argv.previewToken) {
      log.error('Please make sure to specify --include-drafts to be able to get drafts')
      process.exit(1)
    }

    return true
  })
  .argv

opts.sourceSpace = opts.sourceSpace || opts.spaceId
opts.sourceManagementToken = opts.sourceManagementToken || opts.managementToken
opts.exportDir = opts.exportDir || process.cwd()

module.exports = {
  opts: opts,
  errorLogFile: opts.exportDir + '/contentful-export-' + Date.now() + '.log'
}
