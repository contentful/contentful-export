import getSpaceData from '../../../lib/tasks/get-space-data'

const maxAllowedLimit = 100
const resultItemCount = 420

function pagedResult (query, maxItems, mock = {}) {
  const { skip, limit } = query
  const cnt = maxItems - skip > limit ? limit : maxItems - skip
  return {
    items: Array.from({ length: cnt}, (n) => {
      const id = n * skip + 1
      return Object.assign({ sys: { id }}, mock)
    }),
    total: maxItems
  }
}

function pagedContentResult (query, maxItems, mock = {}) {
  const result = pagedResult(query, maxItems, mock)
  result.items.map((item, index) => {
    item.sys.publishedVersion = index % 2
    return item
  })
  return result
}

const mockClient = {
  space: {},
  environment: {},
  contentType: {},
  entry: {},
  asset: {},
  locale: {},
  tag: {},
  webhook: {},
  role: {},
  editorInterface: {}
}

const mockAsset = { metadata: { tags: [{}] } }
const mockEntry = { metadata: { tags: [{}] } }

function setupMocks () {
  mockClient.space.get = jest.fn(() => Promise.resolve({}))
  mockClient.environment.get = jest.fn(() => Promise.resolve({}))
  mockClient.contentType.getMany = jest.fn((query) => {
    return Promise.resolve(pagedResult(query, resultItemCount))
  })
  mockClient.entry.getMany = jest.fn((query) => {
    return Promise.resolve(pagedContentResult(query, resultItemCount, mockEntry))
  })
  mockClient.asset.getMany = jest.fn((query) => {
    return Promise.resolve(pagedContentResult(query, resultItemCount, mockAsset))
  })
  mockClient.locale.getMany = jest.fn((query) => {
    return Promise.resolve(pagedResult(query, resultItemCount))
  })
  mockClient.tag.getMany = jest.fn((query) => {
    return Promise.resolve(pagedResult(query, resultItemCount))
  })
  mockClient.webhook.getMany = jest.fn((query) => {
    return Promise.resolve(pagedResult(query, resultItemCount))
  })
  mockClient.role.getMany = jest.fn((query) => {
    return Promise.resolve(pagedResult(query, resultItemCount))
  })
  mockClient.editorInterface.get = jest.fn(() => Promise.resolve({}))
}

beforeEach(setupMocks)

afterEach(() => {
  mockClient.space.get.mockClear()
  mockClient.environment.get.mockClear()
  mockClient.contentType.getMany.mockClear()
  mockClient.entry.getMany.mockClear()
  mockClient.asset.getMany.mockClear()
  mockClient.locale.getMany.mockClear()
  mockClient.tag.getMany.mockClear()
  mockClient.webhook.getMany.mockClear()
  mockClient.role.getMany.mockClear()
  mockClient.editorInterface.get.mockClear()
})

test('Gets whole destination content', () => {
  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    maxAllowedLimit
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(mockClient.space.get.mock.calls).toHaveLength(1)
      expect(mockClient.environment.get.mock.calls).toHaveLength(1)
      expect(mockClient.contentType.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.entry.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.asset.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.locale.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.tag.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.role.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.editorInterface.get.mock.calls).toHaveLength(resultItemCount)
      expect(response.data.contentTypes).toHaveLength(resultItemCount)
      expect(response.data.entries).toHaveLength(resultItemCount / 2)
      expect(response.data.assets).toHaveLength(resultItemCount / 2)
      expect(response.data.locales).toHaveLength(resultItemCount)
      expect(response.data.tags).toHaveLength(resultItemCount)
      expect(response.data.webhooks).toHaveLength(resultItemCount)
      expect(response.data.roles).toHaveLength(resultItemCount)
      expect(response.data.editorInterfaces).toHaveLength(resultItemCount)
    })
})

test('Gets whole destination content without content model', () => {
  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    maxAllowedLimit,
    skipContentModel: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(mockClient.space.get.mock.calls).toHaveLength(1)
      expect(mockClient.environment.get.mock.calls).toHaveLength(1)
      expect(mockClient.contentType.getMany.mock.calls).toHaveLength(0)
      expect(mockClient.entry.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.asset.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.locale.getMany.mock.calls).toHaveLength(0)
      expect(mockClient.tag.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.role.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.editorInterface.get.mock.calls).toHaveLength(0)
      expect(response.data.contentTypes).toBeUndefined()
      expect(response.data.entries).toHaveLength(resultItemCount / 2)
      expect(response.data.assets).toHaveLength(resultItemCount / 2)
      expect(response.data.locales).toBeUndefined()
      expect(response.data.tags).toHaveLength(resultItemCount)
      expect(response.data.webhooks).toHaveLength(resultItemCount)
      expect(response.data.roles).toHaveLength(resultItemCount)
      expect(response.data.editorInterfaces).toBeUndefined()
    })
})

test('Gets whole destination content without content', () => {
  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    maxAllowedLimit,
    skipContent: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(mockClient.space.get.mock.calls).toHaveLength(1)
      expect(mockClient.environment.get.mock.calls).toHaveLength(1)
      expect(mockClient.contentType.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.entry.getMany.mock.calls).toHaveLength(0)
      expect(mockClient.asset.getMany.mock.calls).toHaveLength(0)
      expect(mockClient.locale.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.tag.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.role.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.editorInterface.get.mock.calls).toHaveLength(resultItemCount)
      expect(response.data.contentTypes).toHaveLength(resultItemCount)
      expect(response.data.entries).toBeUndefined()
      expect(response.data.assets).toBeUndefined()
      expect(response.data.locales).toHaveLength(resultItemCount)
      expect(response.data.tags).toHaveLength(resultItemCount)
      expect(response.data.webhooks).toHaveLength(resultItemCount)
      expect(response.data.roles).toHaveLength(resultItemCount)
      expect(response.data.editorInterfaces).toHaveLength(resultItemCount)
    })
})

test('Gets whole destination content without webhooks', () => {
  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    maxAllowedLimit,
    skipWebhooks: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(mockClient.space.get.mock.calls).toHaveLength(1)
      expect(mockClient.environment.get.mock.calls).toHaveLength(1)
      expect(mockClient.contentType.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.entry.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.asset.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.locale.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.tag.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(0)
      expect(mockClient.role.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.editorInterface.get.mock.calls).toHaveLength(resultItemCount)
      expect(response.data.contentTypes).toHaveLength(resultItemCount)
      expect(response.data.entries).toHaveLength(resultItemCount / 2)
      expect(response.data.assets).toHaveLength(resultItemCount / 2)
      expect(response.data.locales).toHaveLength(resultItemCount)
      expect(response.data.tags).toHaveLength(resultItemCount)
      expect(response.data.webhooks).toBeUndefined()
      expect(response.data.roles).toHaveLength(resultItemCount)
      expect(response.data.editorInterfaces).toHaveLength(resultItemCount)
    })
})

test('Gets whole destination content without roles', () => {
  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    maxAllowedLimit,
    skipRoles: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(mockClient.space.get.mock.calls).toHaveLength(1)
      expect(mockClient.environment.get.mock.calls).toHaveLength(1)
      expect(mockClient.contentType.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.entry.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.asset.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.locale.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.tag.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.role.getMany.mock.calls).toHaveLength(0)
      expect(mockClient.editorInterface.get.mock.calls).toHaveLength(resultItemCount)
      expect(response.data.contentTypes).toHaveLength(resultItemCount)
      expect(response.data.entries).toHaveLength(resultItemCount / 2)
      expect(response.data.assets).toHaveLength(resultItemCount / 2)
      expect(response.data.locales).toHaveLength(resultItemCount)
      expect(response.data.tags).toHaveLength(resultItemCount)
      expect(response.data.webhooks).toHaveLength(resultItemCount)
      expect(response.data.roles).toBeUndefined()
      expect(response.data.editorInterfaces).toHaveLength(resultItemCount)
    })
})

test('Gets whole destination content without editor interfaces', () => {
  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    maxAllowedLimit,
    skipEditorInterfaces: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(mockClient.space.get.mock.calls).toHaveLength(1)
      expect(mockClient.environment.get.mock.calls).toHaveLength(1)
      expect(mockClient.contentType.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.entry.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.asset.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.locale.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.tag.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.role.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.editorInterface.get.mock.calls).toHaveLength(0)
      expect(response.data.contentTypes).toHaveLength(resultItemCount)
      expect(response.data.entries).toHaveLength(resultItemCount / 2)
      expect(response.data.assets).toHaveLength(resultItemCount / 2)
      expect(response.data.locales).toHaveLength(resultItemCount)
      expect(response.data.tags).toHaveLength(resultItemCount)
      expect(response.data.webhooks).toHaveLength(resultItemCount)
      expect(response.data.roles).toHaveLength(resultItemCount)
      expect(response.data.editorInterfaces).toBeUndefined()
    })
})

test('Gets whole destination content without tags', () => {
  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    maxAllowedLimit,
    skipTags: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(mockClient.space.get.mock.calls).toHaveLength(1)
      expect(mockClient.environment.get.mock.calls).toHaveLength(1)
      expect(mockClient.contentType.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.entry.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.asset.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.locale.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.tag.getMany.mock.calls).toHaveLength(0)
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.role.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.editorInterface.get.mock.calls).toHaveLength(resultItemCount)
      expect(response.data.contentTypes).toHaveLength(resultItemCount)
      expect(response.data.entries).toHaveLength(resultItemCount / 2)
      expect(response.data.assets).toHaveLength(resultItemCount / 2)
      expect(response.data.locales).toHaveLength(resultItemCount)
      expect(response.data.tags).toBeUndefined()
      expect(response.data.webhooks).toHaveLength(resultItemCount)
      expect(response.data.roles).toHaveLength(resultItemCount)
      expect(response.data.editorInterfaces).toHaveLength(resultItemCount)
    })
})

test('Gets whole destination content with drafts', () => {
  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    maxAllowedLimit,
    includeDrafts: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(mockClient.space.get.mock.calls).toHaveLength(1)
      expect(mockClient.environment.get.mock.calls).toHaveLength(1)
      expect(mockClient.contentType.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.entry.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.asset.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.locale.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.tag.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.role.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.editorInterface.get.mock.calls).toHaveLength(resultItemCount)
      expect(response.data.contentTypes).toHaveLength(resultItemCount)
      expect(response.data.entries).toHaveLength(resultItemCount)
      expect(response.data.assets).toHaveLength(resultItemCount)
      expect(response.data.locales).toHaveLength(resultItemCount)
      expect(response.data.tags).toHaveLength(resultItemCount)
      expect(response.data.webhooks).toHaveLength(resultItemCount)
      expect(response.data.roles).toHaveLength(resultItemCount)
      expect(response.data.editorInterfaces).toHaveLength(resultItemCount)
    })
})

test('Gets whole destination content with archived entries', () => {
  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    maxAllowedLimit,
    includeDrafts: true,
    includeArchived: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(mockClient.space.get.mock.calls).toHaveLength(1)
      expect(mockClient.environment.get.mock.calls).toHaveLength(1)
      expect(mockClient.contentType.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.entry.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.asset.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.locale.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.tag.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.role.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.editorInterface.get.mock.calls).toHaveLength(resultItemCount)
      expect(response.data.contentTypes).toHaveLength(resultItemCount)
      expect(response.data.entries).toHaveLength(resultItemCount)
      expect(response.data.assets).toHaveLength(resultItemCount)
      expect(response.data.locales).toHaveLength(resultItemCount)
      expect(response.data.tags).toHaveLength(resultItemCount)
      expect(response.data.webhooks).toHaveLength(resultItemCount)
      expect(response.data.roles).toHaveLength(resultItemCount)
      expect(response.data.editorInterfaces).toHaveLength(resultItemCount)
    })
})

test('Skips webhooks & roles for non-master environments', () => {
  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    environmentId: 'staging',
    maxAllowedLimit,
    includeDrafts: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(mockClient.space.get.mock.calls).toHaveLength(1)
      expect(mockClient.environment.get.mock.calls).toHaveLength(1)
      expect(mockClient.contentType.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.entry.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.asset.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.locale.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.tag.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(0)
      expect(mockClient.role.getMany.mock.calls).toHaveLength(0)
      expect(mockClient.editorInterface.get.mock.calls).toHaveLength(resultItemCount)
      expect(response.data.contentTypes).toHaveLength(resultItemCount)
      expect(response.data.entries).toHaveLength(resultItemCount)
      expect(response.data.assets).toHaveLength(resultItemCount)
      expect(response.data.locales).toHaveLength(resultItemCount)
      expect(response.data.tags).toHaveLength(resultItemCount)
      expect(response.data).not.toHaveProperty('webhooks')
      expect(response.data).not.toHaveProperty('roles')
      expect(response.data.editorInterfaces).toHaveLength(resultItemCount)
    })
})

test('Gets whole destination content and detects missing editor interfaces', () => {
  mockClient.editorInterface.get.mockImplementation(() => Promise.reject(new Error('No editor interface found')))

  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    maxAllowedLimit,
    skipContent: true,
    skipWebhooks: true,
    skipRoles: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(mockClient.space.get.mock.calls).toHaveLength(1)
      expect(mockClient.environment.get.mock.calls).toHaveLength(1)
      expect(mockClient.contentType.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.editorInterface.get.mock.calls).toHaveLength(resultItemCount)
      expect(response.data.contentTypes).toHaveLength(resultItemCount)
      expect(response.data.editorInterfaces).toHaveLength(0)
    })
})

test('Skips editor interfaces since no content types are found', () => {
  mockClient.contentType.getMany.mockImplementation(() => Promise.resolve({
    items: [],
    total: 0
  }))

  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    maxAllowedLimit,
    skipContent: true,
    skipWebhooks: true,
    skipRoles: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(mockClient.space.get.mock.calls).toHaveLength(1)
      expect(mockClient.environment.get.mock.calls).toHaveLength(1)
      expect(mockClient.contentType.getMany.mock.calls).toHaveLength(1)
      expect(mockClient.editorInterface.get.mock.calls).toHaveLength(0)
      expect(response.data.contentTypes).toHaveLength(0)
      expect(response.data.editorInterfaces).toBeUndefined()
    })
})

test('Loads 1000 items per page by default', () => {
  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    skipContent: true,
    skipWebhooks: true,
    skipRoles: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(mockClient.space.get.mock.calls).toHaveLength(1)
      expect(mockClient.environment.get.mock.calls).toHaveLength(1)
      expect(mockClient.contentType.getMany.mock.calls).toHaveLength(1)
      expect(mockClient.contentType.getMany.mock.calls[0][0].limit).toBe(1000)
      expect(mockClient.editorInterface.get.mock.calls).toHaveLength(resultItemCount)
      expect(response.data.contentTypes).toHaveLength(resultItemCount)
      expect(response.data.editorInterfaces).toHaveLength(resultItemCount)
    })
})

test('Query entry/asset respect limit query param', () => {
  // overwrite the getAssets mock so maxItems is larger than default page size in pagedGet (get-space-data.js)
  mockClient.asset.getMany = jest.fn((query) => {
    return Promise.resolve(pagedContentResult(query, 2000, mockEntry))
  })
  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    skipContentModel: true,
    skipWebhooks: true,
    skipRoles: true,
    includeDrafts: true,
    queryEntries: { limit: 20 }, // test limit < pageSize
    queryAssets: { limit: 1001 } // test limit > pageSize
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(mockClient.space.get.mock.calls).toHaveLength(1)
      expect(mockClient.environment.get.mock.calls).toHaveLength(1)
      expect(mockClient.entry.getMany.mock.calls[0][0].limit).toBe(20)
      expect(mockClient.asset.getMany.mock.calls[0][0].limit).toBe(1000) // assets should be called 2x
      expect(mockClient.asset.getMany.mock.calls[1][0].limit).toBe(1) // because it has to fetch the final item in the second page
      expect(response.data.assets).toHaveLength(1001)
      expect(response.data.entries).toHaveLength(20)
    })
})

test('only skips fetched items', () => {
  // overwrite the getLocales only returns 20 items in pages of 10
  mockClient.locale.getMany = jest.fn()
    .mockResolvedValueOnce({
      items: Array.from({ length: 10 }, (n) => {
        const id = n + 1
        return Object.assign({ sys: { id } })
      }),
      total: 20
    })
    .mockResolvedValueOnce({
      items: Array.from({ length: 7 }, (n) => {
        const id = n + 11
        return Object.assign({ sys: { id } })
      }),
      total: 17
    })
  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    skipContent: true,
    skipWebhooks: true,
    skipRoles: true
  })
    .run({
      data: {}
    })
    .then(() => {
      expect(mockClient.space.get.mock.calls).toHaveLength(1)
      expect(mockClient.environment.get.mock.calls).toHaveLength(1)
      expect(mockClient.locale.getMany.mock.calls).toHaveLength(2)
      expect(mockClient.locale.getMany.mock.calls[0][0].limit).toBe(1000)
      expect(mockClient.locale.getMany.mock.calls[0][0].skip).toBe(0)
      expect(mockClient.locale.getMany.mock.calls[1][0].limit).toBe(1000)
      expect(mockClient.locale.getMany.mock.calls[1][0].skip).toBe(10)
    })
})

test('halts fetching when no items in page', () => {
  // overwrite the getLocales returns 0 items
  mockClient.locale.getMany = jest.fn()
    .mockResolvedValueOnce({
      items: [],
      total: 20
    })
  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    skipContent: true,
    skipWebhooks: true,
    skipRoles: true
  })
    .run({
      data: {}
    })
    .then(() => {
      expect(mockClient.space.get.mock.calls).toHaveLength(1)
      expect(mockClient.environment.get.mock.calls).toHaveLength(1)
      expect(mockClient.locale.getMany.mock.calls).toHaveLength(1)
      expect(mockClient.locale.getMany.mock.calls[0][0].limit).toBe(1000)
      expect(mockClient.locale.getMany.mock.calls[0][0].skip).toBe(0)
    })
})

test('Strips tags from entries and assets', () => {
  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    maxAllowedLimit,
    stripTags: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(response.data.entries).toHaveLength(resultItemCount / 2)
      const hasAssetsWithTags = response.data.assets.some(asset => asset.metadata?.tags?.length > 0)
      expect(hasAssetsWithTags).toBe(false)
      const hasEntryWithTags = response.data.entries.some(entry => entry.metadata?.tags?.length > 0)
      expect(hasEntryWithTags).toBe(false)
    })
})
