import { shouldCreateNewCacheItem } from '../../../lib/utils/embargoedAssets'
const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000

test('only returns true for expiry time difference less than 6 hours', () => {
  expect(shouldCreateNewCacheItem({ expiresAtMs: 1 }, SIX_HOURS_IN_MS - 2)).toBe(true)
  expect(shouldCreateNewCacheItem({ expiresAtMs: 1 }, SIX_HOURS_IN_MS + 2)).toBe(false)
})
