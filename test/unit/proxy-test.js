import test from 'tape'
import {
  proxyStringToObject,
  proxyObjectToString,
  __get__ as getUnexported
} from '../../lib/utils/proxy'

const parseAuth = getUnexported('parseAuth')

test('proxyString with basic auth, with protocol', (t) => {
  t.plan(2)
  const proxyString = 'http://foo:bar@127.0.0.1:8213'
  const parsed = proxyStringToObject(proxyString)
  const stringified = proxyObjectToString(parsed)

  const expectedStringified = 'foo:bar@127.0.0.1:8213'
  const expectedParsed = {
    host: '127.0.0.1',
    port: 8213,
    isHttps: false,
    auth: {
      username: 'foo',
      password: 'bar'
    }
  }

  t.deepEqual(parsed, expectedParsed, 'proxy url gets parsed')
  t.deepEqual(stringified, expectedStringified, 'serializes back to input')
  t.end()
})

test('proxyString without auth, with protocol', (t) => {
  t.plan(2)
  const proxyString = 'http://127.0.0.1:8213'
  const parsed = proxyStringToObject(proxyString)
  const stringified = proxyObjectToString(parsed)

  const expectedStringified = '127.0.0.1:8213'
  const expected = {
    host: '127.0.0.1',
    port: 8213,
    isHttps: false
  }

  t.deepEqual(parsed, expected, 'proxy url gets parsed')
  t.deepEqual(stringified, expectedStringified, 'serializes back to input')
  t.end()
})

test('proxyString with basic auth, without protocol', (t) => {
  t.plan(2)
  const proxyString = 'foo:bar@127.0.0.1:8213'
  const parsed = proxyStringToObject(proxyString)
  const stringified = proxyObjectToString(parsed)

  const expectedStringified = 'foo:bar@127.0.0.1:8213'
  const expectedParsed = {
    host: '127.0.0.1',
    port: 8213,
    isHttps: false,
    auth: {
      username: 'foo',
      password: 'bar'
    }
  }

  t.deepEqual(parsed, expectedParsed, 'proxy url gets parsed')
  t.deepEqual(stringified, expectedStringified, 'serializes back to input')
  t.end()
})

test('proxyString without auth, without protocol', (t) => {
  t.plan(2)
  const proxyString = '127.0.0.1:8213'
  const parsed = proxyStringToObject(proxyString)
  const stringified = proxyObjectToString(parsed)

  const expectedStringified = '127.0.0.1:8213'
  const expected = {
    host: '127.0.0.1',
    port: 8213,
    isHttps: false
  }

  t.deepEqual(parsed, expected, 'proxy url gets parsed')
  t.deepEqual(stringified, expectedStringified, 'serializes back to input')
  t.end()
})

test('parseAuth with null (empty auth in url.parse)', (t) => {
  t.plan(2)
  const { username, password } = parseAuth(null)
  t.notOk(username)
  t.notOk(password)
  t.end()
})

test('parseAuth with username', (t) => {
  t.plan(2)
  const { username, password } = parseAuth('user')
  t.equal(username, 'user')
  t.notOk(password)
  t.end()
})

test('parseAuth with username & password', (t) => {
  t.plan(2)
  const { username, password } = parseAuth('user:53cr37')
  t.equal(username, 'user')
  t.equal(password, '53cr37')
  t.end()
})
