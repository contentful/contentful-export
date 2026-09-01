export class TimeoutError extends Error {
  constructor(message, request) {
    super(message)
    this.name = 'TimeoutError'
    this.request = request
  }
}

/**
 * Formats the CMA/CDA request a timeout occurred on into a short, human
 * readable string for use in {@link TimeoutError} messages.
 *
 * @param {object} [request] - Details of the request that timed out.
 * @param {string} [request.resource] - Client namespace the request was made through, e.g. `'entry'` or `'withAllLocales'`.
 * @param {string} [request.method] - Method called on `resource`, e.g. `'getMany'`
 * @param {string} [request.spaceId] - ID of the space being queried.
 * @param {string} [request.environmentId] - ID of the environment being queried.
 * @param {object} [request.query] - Query parameters sent with the request, e.g. `{ skip, limit }`.
 * @returns {string} A comma separated description, or an empty string if no details were given.
 *
 * @example
 * describeRequest({
 *   resource: 'entry',
 *   method: 'getMany',
 *   spaceId: 'space123',
 *   environmentId: 'master',
 *   query: { skip: 200, limit: 100 }
 * })
 * // => "client.entry.getMany(), space: space123, environment: master, query: skip=200&limit=100"
 */
function describeRequest({ resource, method, spaceId, environmentId, query } = {}) {
  const parts = []
  if (resource && method) {
    parts.push(`client.${resource}.${method}()`)
  }
  if (spaceId) {
    parts.push(`space: ${spaceId}`)
  }
  if (environmentId) {
    parts.push(`environment: ${environmentId}`)
  }
  if (query && Object.keys(query).length > 0) {
    const queryString = Object.entries(query)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')
    parts.push(`query: ${queryString}`)
  }
  return parts.join(', ')
}

/**
 * Races a single async operation against a clock. Does not retry or cancel
 * the underlying operation - it only stops waiting on it, so callers must
 * decide what "continuing" means for their own use case.
 *
 * @param operation {() => Promise<any>}
 * @param options {{ ms: number, label: string, request?: { resource?: string, method?: string, spaceId?: string, environmentId?: string, query?: object } }}
 */
export async function withTimeout(operation, { ms, label, request }) {
  const maxTime = new Promise((_, reject) => {
    setTimeout(() => {
      const requestDescription = describeRequest(request)
      const details = requestDescription ? ` (${requestDescription})` : ''
      reject(new TimeoutError(
        `contentful-export: ${label} timed out after ${ms / 1000}s${details}. ` +
        'This timeout is enforced by contentful-export itself, not returned by the Contentful API - ' +
        'the request may still be in flight.',
        request
      ))
    }, ms)
  })

  const response = await Promise.race([operation(), maxTime])
  return response
}
