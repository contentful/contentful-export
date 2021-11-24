const { getHeadersConfig } = require('../../../lib/utils/headers')

test('getHeadersConfig returns empty object when value is undefined', () => {
  expect(getHeadersConfig(undefined)).toEqual({})
})

test('getHeadersConfig accepts single or multiple values', () => {
  expect(getHeadersConfig('Accept: Any')).toEqual({
    Accept: 'Any',
    'CF-Sequence': expect.any(String)
  })
  expect(getHeadersConfig(['Accept: Any', 'X-Version: 1'])).toEqual({
    Accept: 'Any',
    'X-Version': '1',
    'CF-Sequence': expect.any(String)
  })
})

test('getHeadersConfig ignores invalid headers', () => {
  expect(
    getHeadersConfig(['Accept: Any', 'X-Version: 1', 'invalid'])
  ).toEqual({
    Accept: 'Any',
    'X-Version': '1',
    'CF-Sequence': expect.any(String)
  })
})

test('getHeadersConfig trims spacing around keys & values', () => {
  expect(
    getHeadersConfig([
      '  Accept:   Any   ',
      '   X-Version   :1 ',
      'invalid'
    ])
  ).toEqual({
    Accept: 'Any',
    'X-Version': '1',
    'CF-Sequence': expect.any(String)
  })
})
