import test from 'tape'
import sinon from 'sinon'
import Promise from 'bluebird'
import runContentfulExport from '../lib/run-contentful-export'

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
  writeFile: sinon.stub().returns(Promise.resolve())
}
runContentfulExport.__Rewire__('fs', fsMock)

test('Runs space sync', (t) => {
  runContentfulExport({
    opts: {},
    errorLogFile: 'errorlogfile'
  })
  .then(() => {
    t.ok(createClientsStub.called, 'create clients')
    t.ok(getFullSourceSpaceStub.called, 'get full space')

    runContentfulExport.__ResetDependency__('createClients')
    runContentfulExport.__ResetDependency__('getFullSourceSpace')
    t.end()
  })
})
