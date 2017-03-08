'use strict';

var yargs = require('yargs');
var log = require('npmlog');
var packageFile = require('../package');

var opts = yargs.version(packageFile.version || 'Version only available on installed package').usage('Usage: $0 [options]').option('space-id', {
  describe: 'ID of Space with source data',
  type: 'string',
  demand: true
}).option('rate-limit', {
  describe: 'How many requests to perform per period of time',
  type: 'number',
  default: 6
}).option('rate-limit-period', {
  describe: 'How much time to wait before retry in ms',
  type: 'number',
  default: 1000
}).option('management-token', {
  describe: 'Management API token for the space to be exported.',
  type: 'string',
  demand: true
}).option('export-dir', {
  describe: 'Defines the path for storing the export json file (default path is the current directory)',
  type: 'string'
}).option('include-drafts', {
  describe: 'include drafts drafts in the exported entries',
  type: 'boolean',
  default: false
}).option('skip-roles', {
  describe: 'Define this flag ti skip exporting roles and permissions',
  type: 'boolean',
  default: false
}).option('skip-content-model', {
  describe: 'Define this flag to skip exporting content models',
  type: 'boolean',
  default: false
}).option('skip-content', {
  describe: 'Define this flag to skip exporting Assets and Entries',
  type: 'boolean',
  default: false
}).option('skip-webhooks', {
  describe: 'Define this flag ti skip exporting webhooks',
  type: 'boolean',
  default: false
}).option('download-assets', {
  describe: 'With this flags assets will also be downloaded',
  type: 'boolean'
}).option('max-allowed-limit', {
  describe: 'How many item per page per request',
  type: 'number',
  default: 1000
}).config('config', 'Configuration file with required values').check(function (argv) {
  if (!argv.spaceId) {
    log.error('Please provide --space-id to be used to export \n' + 'For more info See: https://www.npmjs.com/package/contentful-export');
    process.exit(1);
  }
  if (!argv.managementToken) {
    log.error('Please provide --management-token to be used for export \n' + 'For more info See: https://www.npmjs.com/package/contentful-export');
    process.exit(1);
  }
  return true;
}).argv;

opts.sourceSpace = opts.sourceSpace || opts.spaceId;
opts.sourceManagementToken = opts.sourceManagementToken || opts.managementToken;
opts.exportDir = opts.exportDir || process.cwd();

module.exports = {
  opts: opts,
  errorLogFile: opts.exportDir + '/contentful-export-' + Date.now() + '.log'
};