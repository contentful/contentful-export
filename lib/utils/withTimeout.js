export class TimeoutError extends Error {
  constructor(message) {
    super(message)
    this.name = 'TimeoutError'
  }
}

/**
 * Races a single async operation against a clock. Does not retry or cancel
 * the underlying operation - it only stops waiting on it, so callers must
 * decide what "continuing" means for their own use case.
 *
 * @param operation {() => Promise<any>}
 */
export async function withTimeout(operation, { ms, label }) {
  const maxTime = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(`${label} timed out after ${ms / 1000}s`))
    }, ms)
  })

  const response = await Promise.race([operation(), maxTime])
  return response
}
