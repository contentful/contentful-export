import { resolve } from 'path'

import test from 'blue-tape'
import Promise from 'bluebird'
import sinon from 'sinon'

import {
  default as runContentfulExport,
  __RewireAPI__ as runContentfulExportRewireAPI
} from '../../lib/index'

const fullSpaceResponse = {
  'contentTypes': [],
  'entries': [],
  'assets': [],
  'locales': []
}

const createClientsStub = sinon.stub()
const getFullSourceSpaceStub = sinon.stub()

const fsMock = {
  writeFileSync: sinon.stub(),
  existsSync: sinon.stub(),
  mkdirSync: sinon.stub()
}

const fakeLogEmitter = {
  emit: sinon.stub(),
  addListener: sinon.stub()
}

const fakeErrorEmitter = {
  emit: sinon.stub(),
  addListener: sinon.stub()
}

const fakeBfj = {
  write: sinon.stub()
}

function setup () {
  createClientsStub.returns({ source: {delivery: {}}, destination: {management: {}} })
  getFullSourceSpaceStub.returns(Promise.resolve(fullSpaceResponse))
  fsMock.writeFileSync.returns(Promise.resolve())
  fsMock.existsSync.returns(true)
  fsMock.mkdirSync.returns(undefined)
  fakeBfj.write.returns(Promise.resolve())

  runContentfulExportRewireAPI.__Rewire__('createClients', createClientsStub)
  runContentfulExportRewireAPI.__Rewire__('getFullSourceSpace', getFullSourceSpaceStub)
  runContentfulExportRewireAPI.__Rewire__('fs', fsMock)
  runContentfulExportRewireAPI.__Rewire__('bfj', fakeBfj)
  runContentfulExportRewireAPI.__Rewire__('logEmitter', fakeLogEmitter)
  runContentfulExportRewireAPI.__Rewire__('errorEmitter', fakeErrorEmitter)
}

function teardown () {
  createClientsStub.reset()
  getFullSourceSpaceStub.reset()
  fakeLogEmitter.emit.reset()
  fakeLogEmitter.addListener.reset()
  fakeErrorEmitter.emit.reset()
  fakeErrorEmitter.addListener.reset()
  fsMock.writeFileSync.reset()
  fsMock.existsSync.reset()
  fsMock.mkdirSync.reset()
  fakeBfj.write.reset()

  runContentfulExportRewireAPI.__ResetDependency__('createClients')
  runContentfulExportRewireAPI.__ResetDependency__('getFullSourceSpace')
  runContentfulExportRewireAPI.__ResetDependency__('fs')
  runContentfulExportRewireAPI.__ResetDependency__('bfj')
  runContentfulExportRewireAPI.__ResetDependency__('logEmitter')
  runContentfulExportRewireAPI.__ResetDependency__('errorEmitter')
}

test('Runs Contentful Export', (t) => {
  setup()
  runContentfulExport({
    errorLogFile: 'errorlogfile',
    spaceId: 'someSpaceId',
    managementToken: 'someManagementToken'
  })
    .then((returnedData) => {
      t.ok(createClientsStub.called, 'create clients')
      t.ok(getFullSourceSpaceStub.called, 'get full space')
      teardown()
      t.end()
    }).catch((error) => {
      t.fail('Should not throw ', error)
      teardown()
      t.end()
    })
})

test('Creates a valid and correct opts object', (t) => {
  setup()
  const errorLogFile = 'errorlogfile'
  const exampleConfig = require('../../example-config.json')

  runContentfulExport({
    errorLogFile,
    config: resolve(__dirname, '..', '..', 'example-config.json')
  })
    .then(() => {
      const opts = createClientsStub.args[0][0]
      t.false(opts.skipContentModel, 'defaults are applied')
      t.equal(opts.errorLogFile, resolve(process.cwd(), errorLogFile), 'defaults can be overwritten')
      t.equal(opts.spaceId, exampleConfig.spaceId, 'config file values are taken')
      teardown()
      t.end()
    }).catch((error) => {
      t.fail('Should not throw error')
      console.log({error, errors: error.errors})
      teardown()
      t.end()
    })
})

test('Run Contentful export fails due to rejection', (t) => {
  setup()
  const rejectError = new Error()
  rejectError.request = {uri: 'erroruri'}
  getFullSourceSpaceStub.returns(Promise.reject(rejectError))

  runContentfulExport({
    errorLogFile: 'errorlogfile',
    spaceId: 'someSpaceId',
    managementToken: 'someManagementToken'
  })
    .then(() => {
      t.fail('Should throw error')
      teardown()
      t.end()
    })
    .catch(() => {
      t.ok(getFullSourceSpaceStub.calledOnce, 'tries to get full source space')
      t.notOk(fakeBfj.write.called, 'did not write any file since an error happened')
      t.pass('test passed since export promise got rejected')
      teardown()
      t.end()
    })
})
