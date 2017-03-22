import test from 'tape'
import sinon from 'sinon'
import Promise from 'bluebird'
import runContentfulExport from '../lib/index'
import dumpErrorBuffer from '../lib/dump-error-buffer'
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

const rejectError = new Error()
rejectError.request = {uri: 'erroruri'}
const getFullSourceSpaceWithErrorStub = sinon.stub().returns(Promise.reject(rejectError))
const fsMock = {
  writeFileSync: sinon.stub().returns(Promise.resolve()),
  existsSync: sinon.stub().returns(true),
  mkdirSync: sinon.stub().returns(undefined)
}
runContentfulExport.__Rewire__('fs', fsMock)
dumpErrorBuffer.__Rewire__('fs', fsMock)
const dumpErrorBufferStub = sinon.stub()
runContentfulExport.__Rewire__('dumpErrorBuffer', dumpErrorBufferStub)

test('Runs Contentful Export', (t) => {
  runContentfulExport({
    opts: {},
    errorLogFile: 'errorlogfile'
  })
  .then(() => {
    t.ok(createClientsStub.called, 'create clients')
    t.ok(getFullSourceSpaceStub.called, 'get full space')
    runContentfulExport.__ResetDependency__('getFullSourceSpace')
    t.end()
  }).catch((error) => {
    t.fail('Should not throw ', error)
    t.end()
  })
})

test('Runs Contentful fails', (t) => {
  runContentfulExport.__Rewire__('getFullSourceSpace', getFullSourceSpaceWithErrorStub)
  runContentfulExport({
    opts: {},
    errorLogFile: 'errorlogfile'
  })
  .then(() => {})
  .catch(() => {
    t.ok(dumpErrorBufferStub.called)
    runContentfulExport.__ResetDependency__('getFullSourceSpace')
    runContentfulExport.__ResetDependency__('createClients')
    runContentfulExport.__ResetDependency__('dumpErrorBuffer')
    t.end()
  })
})
