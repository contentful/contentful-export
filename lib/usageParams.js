import yargs from 'yargs'
import packageFile from '../package'

export default yargs
  .version(packageFile.version || 'Version only available on installed package')
  .usage('Usage: $0 [options]')
  .option('space-id', {
    describe: 'ID of Space with source data',
    type: 'string',
    demand: true
  })
  .option('environment-id', {
    describe: 'ID of Environment with source data',
    type: 'string',
    default: 'master'
  })
  .option('management-token', {
    describe: 'Contentful management API token for the space to be exported',
    type: 'string',
    demand: true
  })
  .option('delivery-token', {
    describe: 'Contentful Content Delivery API token for the space to be exported',
    type: 'string'
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
  .option('include-archived', {
    describe: 'Include archived entries in the exported entries',
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
  .option('skip-roles', {
    describe: 'Skip exporting roles and permissions',
    type: 'boolean',
    default: false
  })
  .options('skip-tags', {
    describe: 'Skip exporting tags',
    type: 'boolean',
    default: false
  })
  .option('skip-webhooks', {
    describe: 'Skip exporting webhooks',
    type: 'boolean',
    default: false
  })
  .options('strip-tags', {
    describe: 'Untag assets and entries',
    type: 'boolean',
    default: false
  })
  .option('content-only', {
    describe: 'only export entries and assets',
    type: 'boolean',
    default: false
  })
  .option('download-assets', {
    describe: 'With this flags asset files will also be downloaded',
    type: 'boolean'
  })
  .option('max-allowed-limit', {
    describe: 'How many items per page per request',
    type: 'number',
    default: 1000
  })
  .option('host', {
    describe: 'Management API host',
    type: 'string',
    default: 'api.contentful.com'
  })
  .option('host-delivery', {
    describe: 'Delivery API host',
    type: 'string',
    default: 'cdn.contentful.com'
  })
  .option('proxy', {
    describe: 'Proxy configuration in HTTP auth format: [http|https]://host:port or [http|https]://user:password@host:port',
    type: 'string'
  })
  .option('raw-proxy', {
    describe: 'Pass proxy config to Axios instead of creating a custom httpsAgent',
    type: 'boolean',
    default: false
  })
  .option('error-log-file', {
    describe: 'Full path to the error log file',
    type: 'string'
  })
  .option('query-entries', {
    describe: 'Exports only entries that matches these queries',
    type: 'array'
  })
  .option('query-assets', {
    describe: 'Exports only assets that matches these queries',
    type: 'array'
  })
  .option('content-file', {
    describe: 'The filename for the exported data',
    type: 'string'
  })
  .option('save-file', {
    describe: 'Save the export as a json file',
    type: 'boolean',
    default: true
  })
  .option('use-verbose-renderer', {
    describe: 'Display progress in new lines instead of displaying a busy spinner and the status in the same line. Useful for CI.',
    type: 'boolean',
    default: false
  })
  .option('header', {
    alias: 'H',
    type: 'string',
    describe: 'Pass an additional HTTP Header'
  })
  .config('config', 'An optional configuration JSON file containing all the options for a single run')
  .argv
