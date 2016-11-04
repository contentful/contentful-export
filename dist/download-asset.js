'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = downloadAsset;

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var request = require('request');
var path = require('path');

function downloadAsset(url, directory) {
  return new Promise(function (resolve, reject) {
    // build local file path from the url for the download
    var urlParts = url.split('//');

    var localFile = path.join(directory, urlParts[urlParts.length - 1].split('/').join('-'));

    // ensure directory exists and create file stream
    _fsExtra2.default.mkdirsSync(path.dirname(localFile));
    var file = _fsExtra2.default.createWriteStream(localFile);

    // handle urls without protocol
    if (url.startsWith('//')) {
      url = 'https:' + url;
    }

    // download asset
    var assetRequest = request.get(url);
    assetRequest.on('response', function (response) {
      // handle error response
      if (response.statusCode >= 400) {
        file.end();
        reject('error response status: ' + response.statusCode);
        return;
      }

      // pipe response content to file
      response.pipe(file);

      file.on('finish', function () {
        file.close();
        resolve(localFile);
      });
    });

    // handle request errors
    assetRequest.on('error', function (error) {
      file.end();
      reject(error);
    });
  });
}