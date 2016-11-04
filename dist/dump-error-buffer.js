'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = dumpErrorBuffer;

var _npmlog = require('npmlog');

var _npmlog2 = _interopRequireDefault(_npmlog);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _errorBuffer = require('contentful-batch-libs/utils/error-buffer');

var _errorBuffer2 = _interopRequireDefault(_errorBuffer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function dumpErrorBuffer(params) {
  var message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Additional errors were found';
  var errorLogFile = params.errorLogFile;

  var loggedErrors = _errorBuffer2.default.drain();
  if (loggedErrors.length > 0) {
    var errorOutput = {
      additionalInfo: {}
    };
    _fs2.default.writeFileSync(errorLogFile, JSON.stringify(errorOutput, null, '  '));
    _npmlog2.default.warn(message);
    _npmlog2.default.warn('Check ' + errorLogFile + ' for details.');
  }
}