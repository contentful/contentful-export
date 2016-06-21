var yargs = require('yargs')
var log = require('npmlog')
var packageFile = require('../package')

var opts = yargs
  .version(packageFile.version || 'Version only available on installed package')
  .usage('Usage: $0 [options]')
  .option('space-id', {
    describe: 'ID of Space with source data',
    type: 'string',
    demand: true
  })
  .check(function (argv) {
    if (!argv.spaceId) {
      log.error('Please provide --space-id to be used to export \n' +
          'For more info See: https://www.npmjs.com/package/contentful-export'
      )
      process.exit(1)
    }
    return true
  })
  .option('export-dir', {
    describe: 'Defines the path for storing the export json file (default path is the current directory)',
    type: 'string'
  })
  .argv

var exportDir = opts.exportDir || process.cwd()

module.exports = {
  opts: opts,
  errorLogFile: exportDir + '/contentful-export-' + Date.now() + '.log'
}
