'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = runContentfulExport;

var _createClients = require('contentful-batch-libs/utils/create-clients');

var _createClients2 = _interopRequireDefault(_createClients);

var _dumpErrorBuffer = require('./dump-error-buffer');

var _dumpErrorBuffer2 = _interopRequireDefault(_dumpErrorBuffer);

var _downloadAsset = require('./download-asset');

var _downloadAsset2 = _interopRequireDefault(_downloadAsset);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _getFullSourceSpace = require('contentful-batch-libs/get/get-full-source-space');

var _getFullSourceSpace2 = _interopRequireDefault(_getFullSourceSpace);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _jsonStringifySafe = require('json-stringify-safe');

var _jsonStringifySafe2 = _interopRequireDefault(_jsonStringifySafe);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = require('npmlog');

_bluebird2.default.promisifyAll(_fs2.default);
function runContentfulExport(usageParams) {
  var opts = usageParams.opts,
      errorLogFile = usageParams.errorLogFile;

  var exportToFile = true;
  if (!opts) {
    exportToFile = false;
    opts = {};
    opts.sourceSpace = opts.sourceSpace || usageParams.spaceId;
    opts.sourceManagementToken = opts.sourceManagementToken || usageParams.managementToken;
  }
  var clients = (0, _createClients2.default)(opts);
  return (0, _getFullSourceSpace2.default)({
    managementClient: clients.source.management,
    spaceId: clients.source.spaceId
  }).then(function (response) {
    if (opts.downloadAssets) {
      var successCount = 0;
      var warningCount = 0;
      var errorCount = 0;

      log.info('Downloading ' + response.assets.length + ' assets');

      var arrayOfDownloadPromises = [];
      response.assets.forEach(function (asset) {
        if (asset.fields.file) {
          Object.keys(asset.fields.file).forEach(function (key) {
            arrayOfDownloadPromises.push((0, _downloadAsset2.default)(asset.fields.file[key].url, opts.exportDir).then(function (downLoadedFile) {
              log.info('-> ' + downLoadedFile);
              successCount++;
            }).catch(function (error) {
              var url = asset.fields.file[key].url;

              log.error('-> error downloading ' + url + ' => ' + error);
              errorCount++;
              return _bluebird2.default.resolve(url);
            }));
          });
        } else {
          log.warn('-> asset has no file(s)', (0, _jsonStringifySafe2.default)(asset));
          warningCount++;
        }
      });

      _bluebird2.default.all(arrayOfDownloadPromises).then(function () {
        log.info('All ' + response.assets.length + ' downloads finished');
        log.info('successes: ' + successCount);
        log.info('warnings: ' + warningCount);
        log.info('errors: ' + errorCount);
      });
    }
    if (exportToFile) {
      var responseFile = opts.exportDir + '/contentful-export-' + clients.source.spaceId + '-' + Date.now() + '.json';
      log.info('Writing space data to json file at : ' + responseFile);
      return _fs2.default.writeFile(responseFile, (0, _jsonStringifySafe2.default)(response, null, 4));
    }
    return response;
  }).catch(function (err) {
    (0, _dumpErrorBuffer2.default)({
      sourceSpace: opts.sourceSpace,
      errorLogFile: errorLogFile
    });
    throw err;
  });
}