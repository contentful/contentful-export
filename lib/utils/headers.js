import { v4 as uuidv4 } from 'uuid'

/**
 * Turn header option into an object. Invalid header values
 * are ignored.
 *
 * @example
 * getHeadersConfig('Accept: Any')
 * // -> {Accept: 'Any'}
 *
 * @example
 * getHeadersConfig(['Accept: Any', 'X-Version: 1'])
 * // -> {Accept: 'Any', 'X-Version': '1'}
 *
 * @param value {string|string[]}
 */
export function getHeadersConfig (value) {
  if (!value) {
    return {}
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return addSequenceHeader(value)
  }

  const values = Array.isArray(value) ? value : [value]

  const formattedHeaders = values.reduce((headers, value) => {
    value = value.trim()

    console.log(value)
    const separatorIndex = value.indexOf(':')

    // Invalid header format
    if (separatorIndex === -1) {
      return headers
    }

    const headerKey = value.slice(0, separatorIndex).trim()
    const headerValue = value.slice(separatorIndex + 1).trim()

    return {
      ...headers,
      [headerKey]: headerValue
    }
  }, {})

  return addSequenceHeader(formattedHeaders)
}

/**
 * Adds sequence header to a headers object
 * @param headers {object}
 *
 */
function addSequenceHeader (headers) {
  return {
    ...headers,
    // Unique sequence header
    'CF-Sequence': uuidv4()
  }
}
