import { withTimeout, TimeoutError } from '../../../lib/utils/withTimeout'

test('resolves with the operation result when it finishes in time', async () => {
  const result = await withTimeout(() => Promise.resolve('done'), { ms: 50, label: 'Fetching entries' })
  expect(result).toBe('done')
})

test('rejects with a TimeoutError once the clock runs out', async () => {
  const neverResolves = () => new Promise(() => {})
  await expect(withTimeout(neverResolves, { ms: 10, label: 'Fetching entries (skip 0, limit 1000)' }))
    .rejects.toThrow('Fetching entries (skip 0, limit 1000) timed out after 0.01s')
})

test('rejects with a TimeoutError instance', async () => {
  const neverResolves = () => new Promise(() => {})
  await expect(withTimeout(neverResolves, { ms: 10, label: 'op' })).rejects.toBeInstanceOf(TimeoutError)
})

test('propagates the operation error when it rejects before the timeout', async () => {
  const failing = () => Promise.reject(new Error('boom'))
  await expect(withTimeout(failing, { ms: 50, label: 'op' })).rejects.toThrow('boom')
})

test('does not fire the timeout after the operation already resolved', async () => {
  const result = await withTimeout(() => Promise.resolve('done'), { ms: 10, label: 'op' })
  await new Promise((resolve) => setTimeout(resolve, 20))
  expect(result).toBe('done')
})
