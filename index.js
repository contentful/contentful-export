try {
  module.exports = require('./dist/run-space-export').default
} catch (err) {
  if (err.code === 'MODULE_NOT_FOUND') {
    require('babel-register')
    module.exports = require('./lib/run-space-export').default
  } else {
    console.log(err)
    process.exit(1)
  }
}
