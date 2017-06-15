import test from 'tape'
import sinon from 'sinon'
import Promise from 'bluebird'
import runContentfulExport from '../../lib/index'
import errorBuffer from 'contentful-batch-libs/dist/utils/error-buffer'
import { resolve } from 'path'

const fullSpaceResponse = {
  'contentTypes': [],
  'entries': [],
  'assets': [],
  'locales': []
}

const createClientsStub = sinon.stub().returns({ source: {delivery: {}}, destination: {management: {}} })
runContentfulExport.__Rewire__('createClients', createClientsStub)

const getFullSourceSpaceStub = sinon.stub().returns(Promise.resolve(fullSpaceResponse))
runContentfulExport.__Rewire__('getFullSourceSpace', getFullSourceSpaceStub)

const fsMock = {
  writeFileSync: sinon.stub().returns(Promise.resolve()),
  existsSync: sinon.stub().returns(true),
  mkdirSync: sinon.stub().returns(undefined)
}
runContentfulExport.__Rewire__('fs', fsMock)
errorBuffer.push = sinon.spy(errorBuffer, 'push')

test('Runs Contentful Export', (t) => {
  runContentfulExport({
    errorLogFile: 'errorlogfile',
    spaceId: 'someSpaceId',
    managementToken: 'someManagementToken'
  })
  .then((returnedData) => {
    t.ok(createClientsStub.called, 'create clients')
    t.ok(getFullSourceSpaceStub.called, 'get full space')
    t.end()
  }).catch((error) => {
    t.fail('Should not throw ', error)
    t.end()
  })
})

test('Creates a valid and correct opts object', (t) => {
  const errorLogFile = 'errorlogfile'
  const exampleConfig = require('../../example-config.json')
  createClientsStub.resetHistory()

  runContentfulExport({
    errorLogFile,
    config: resolve(__dirname, '..', '..', 'example-config.json')
  })
  .then(() => {
    const opts = createClientsStub.args[0][0]
    t.false(opts.skipContentModel, 'defaults are applied')
    t.equal(opts.errorLogFile, errorLogFile, 'defaults can be overwritten')
    t.equal(opts.spaceId, exampleConfig.spaceId, 'config file values are taken')
    t.end()
  }).catch((error) => {
    t.fail('Should not throw ', error)
    t.end()
  })
})

test('Runs Contentful fails', (t) => {
  const rejectError = new Error()
  rejectError.request = {uri: 'erroruri'}
  const getFullSourceSpaceWithErrorStub = sinon.stub().returns(Promise.reject(rejectError))
  runContentfulExport.__Rewire__('getFullSourceSpace', getFullSourceSpaceWithErrorStub)
  runContentfulExport({
    errorLogFile: 'errorlogfile',
    spaceId: 'someSpaceId',
    managementToken: 'someManagementToken'
  })
  .then(() => {
    t.fail('Should throw error')
    t.end()
  })
  .catch(() => {
    t.ok(errorBuffer.push.called)
    t.equal(errorBuffer.push.args[0][0], rejectError)
    t.ok(getFullSourceSpaceWithErrorStub.called)
    runContentfulExport.__ResetDependency__('getFullSourceSpace')
    runContentfulExport.__ResetDependency__('createClients')
    runContentfulExport.__ResetDependency__('dumpErrorBuffer')
    t.end()
  })
})
