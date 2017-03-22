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
    describe: 'Contentful management API token for the space to be exported',
    type: 'string',
    demand: true
  })
  .option('export-dir', {
    describe: 'Defines the path for storing the export json file (default path is the current directory)',
    type: 'string'
  })
  .option('include-drafts', {
    describe: 'Include drafts in the exported entries',
    type: 'boolean',
    default: false
  })
  .option('skip-roles', {
    describe: 'Skip exporting roles and permissions',
    type: 'boolean',
    default: false
  })
  .option('skip-content-model', {
    describe: 'Skip exporting content models',
    type: 'boolean',
    default: false
  })
  .option('skip-content', {
    describe: 'Skip exporting assets and entries',
    type: 'boolean',
    default: false
  })
  .option('skip-webhooks', {
    describe: 'Skip exporting webhooks',
    type: 'boolean',
    default: false
  })
  .option('download-assets', {
    describe: 'With this flags assets will also be downloaded',
    type: 'boolean'
  })
  .option('max-allowed-limit', {
    describe: 'How many items per page per request',
    type: 'number',
    default: 1000
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
