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

const mockSpace = {}

const mockEnvironment = {}

const mockClient = {}

const getEditorInterface = jest.fn()

const mockAsset = { metadata: { tags: [{}] } }

const mockEntry = { metadata: { tags: [{}] } }

function setupMocks () {
  mockClient.getSpace = jest.fn(() => Promise.resolve(mockSpace))
  mockSpace.getEnvironment = jest.fn(() => Promise.resolve(mockEnvironment))
  mockEnvironment.getContentTypes = jest.fn((query) => {
    return Promise.resolve(pagedResult(query, resultItemCount, {
      getEditorInterface
    }))
  })
  mockEnvironment.getEntries = jest.fn((query) => {
    return Promise.resolve(pagedContentResult(query, resultItemCount, mockEntry))
  })
  mockEnvironment.getAssets = jest.fn((query) => {
    return Promise.resolve(pagedContentResult(query, resultItemCount, mockAsset))
  })
  mockEnvironment.getLocales = jest.fn((query) => {
    return Promise.resolve(pagedResult(query, resultItemCount))
  })
  mockEnvironment.getTags = jest.fn((query) => {
    return Promise.resolve(pagedResult(query, resultItemCount))
  })
  mockSpace.getWebhooks = jest.fn((query) => {
    return Promise.resolve(pagedResult(query, resultItemCount))
  })
  mockSpace.getRoles = jest.fn((query) => {
    return Promise.resolve(pagedResult(query, resultItemCount))
  })
  getEditorInterface.mockImplementation(() => Promise.resolve({}))
}

beforeEach(setupMocks)

afterEach(() => {
  mockClient.getSpace.mockClear()
  mockEnvironment.getContentTypes.mockClear()
  mockEnvironment.getEntries.mockClear()
  mockEnvironment.getAssets.mockClear()
  mockEnvironment.getLocales.mockClear()
  mockEnvironment.getTags.mockClear()
  mockSpace.getWebhooks.mockClear()
  mockSpace.getRoles.mockClear()
  getEditorInterface.mockClear()
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
      expect(mockClient.getSpace.mock.calls).toHaveLength(1)
      expect(mockSpace.getEnvironment.mock.calls).toHaveLength(1)
      expect(mockEnvironment.getContentTypes.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getEntries.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getAssets.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getLocales.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getTags.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockSpace.getWebhooks.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockSpace.getRoles.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(getEditorInterface.mock.calls).toHaveLength(resultItemCount)
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
      expect(mockClient.getSpace.mock.calls).toHaveLength(1)
      expect(mockSpace.getEnvironment.mock.calls).toHaveLength(1)
      expect(mockEnvironment.getContentTypes.mock.calls).toHaveLength(0)
      expect(mockEnvironment.getEntries.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getAssets.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getLocales.mock.calls).toHaveLength(0)
      expect(mockEnvironment.getTags.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockSpace.getWebhooks.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockSpace.getRoles.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(getEditorInterface.mock.calls).toHaveLength(0)
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
      expect(mockClient.getSpace.mock.calls).toHaveLength(1)
      expect(mockSpace.getEnvironment.mock.calls).toHaveLength(1)
      expect(mockEnvironment.getContentTypes.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getEntries.mock.calls).toHaveLength(0)
      expect(mockEnvironment.getAssets.mock.calls).toHaveLength(0)
      expect(mockEnvironment.getLocales.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getTags.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockSpace.getWebhooks.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockSpace.getRoles.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(getEditorInterface.mock.calls).toHaveLength(resultItemCount)
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

test('Gets whole destination content without assets', () => {
  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    maxAllowedLimit,
    skipAssets: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(mockClient.getSpace.mock.calls).toHaveLength(1)
      expect(mockSpace.getEnvironment.mock.calls).toHaveLength(1)
      expect(mockEnvironment.getContentTypes.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getEntries.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getAssets.mock.calls).toHaveLength(0)
      expect(mockEnvironment.getLocales.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getTags.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockSpace.getWebhooks.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockSpace.getRoles.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(getEditorInterface.mock.calls).toHaveLength(resultItemCount)
      expect(response.data.contentTypes).toHaveLength(resultItemCount)
      expect(response.data.entries).toHaveLength(resultItemCount / 2)
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
      expect(mockClient.getSpace.mock.calls).toHaveLength(1)
      expect(mockSpace.getEnvironment.mock.calls).toHaveLength(1)
      expect(mockEnvironment.getContentTypes.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getEntries.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getAssets.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getLocales.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getTags.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockSpace.getWebhooks.mock.calls).toHaveLength(0)
      expect(mockSpace.getRoles.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(getEditorInterface.mock.calls).toHaveLength(resultItemCount)
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
      expect(mockClient.getSpace.mock.calls).toHaveLength(1)
      expect(mockSpace.getEnvironment.mock.calls).toHaveLength(1)
      expect(mockEnvironment.getContentTypes.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getEntries.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getAssets.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getLocales.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getTags.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockSpace.getWebhooks.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockSpace.getRoles.mock.calls).toHaveLength(0)
      expect(getEditorInterface.mock.calls).toHaveLength(resultItemCount)
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
      expect(mockClient.getSpace.mock.calls).toHaveLength(1)
      expect(mockSpace.getEnvironment.mock.calls).toHaveLength(1)
      expect(mockEnvironment.getContentTypes.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getEntries.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getAssets.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getLocales.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getTags.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockSpace.getWebhooks.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockSpace.getRoles.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(getEditorInterface.mock.calls).toHaveLength(0)
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
      expect(mockClient.getSpace.mock.calls).toHaveLength(1)
      expect(mockSpace.getEnvironment.mock.calls).toHaveLength(1)
      expect(mockEnvironment.getContentTypes.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getEntries.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getAssets.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getLocales.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getTags.mock.calls).toHaveLength(0)
      expect(mockSpace.getWebhooks.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockSpace.getRoles.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(getEditorInterface.mock.calls).toHaveLength(resultItemCount)
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
      expect(mockClient.getSpace.mock.calls).toHaveLength(1)
      expect(mockSpace.getEnvironment.mock.calls).toHaveLength(1)
      expect(mockEnvironment.getContentTypes.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getEntries.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getAssets.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getLocales.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getTags.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockSpace.getWebhooks.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockSpace.getRoles.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(getEditorInterface.mock.calls).toHaveLength(resultItemCount)
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
      expect(mockClient.getSpace.mock.calls).toHaveLength(1)
      expect(mockSpace.getEnvironment.mock.calls).toHaveLength(1)
      expect(mockEnvironment.getContentTypes.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getEntries.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getAssets.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getLocales.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getTags.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockSpace.getWebhooks.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockSpace.getRoles.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(getEditorInterface.mock.calls).toHaveLength(resultItemCount)
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
      expect(mockClient.getSpace.mock.calls).toHaveLength(1)
      expect(mockSpace.getEnvironment.mock.calls).toHaveLength(1)
      expect(mockEnvironment.getContentTypes.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getEntries.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getAssets.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getLocales.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockEnvironment.getTags.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockSpace.getWebhooks.mock.calls).toHaveLength(0)
      expect(mockSpace.getRoles.mock.calls).toHaveLength(0)
      expect(getEditorInterface.mock.calls).toHaveLength(resultItemCount)
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
  getEditorInterface.mockImplementation(() => Promise.reject(new Error('No editor interface found')))

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
      expect(mockClient.getSpace.mock.calls).toHaveLength(1)
      expect(mockSpace.getEnvironment.mock.calls).toHaveLength(1)
      expect(mockEnvironment.getContentTypes.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(getEditorInterface.mock.calls).toHaveLength(resultItemCount)
      expect(response.data.contentTypes).toHaveLength(resultItemCount)
      expect(response.data.editorInterfaces).toHaveLength(0)
    })
})

test('Skips editor interfaces since no content types are found', () => {
  mockEnvironment.getContentTypes.mockImplementation(() => Promise.resolve({
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
      expect(mockClient.getSpace.mock.calls).toHaveLength(1)
      expect(mockSpace.getEnvironment.mock.calls).toHaveLength(1)
      expect(mockEnvironment.getContentTypes.mock.calls).toHaveLength(1)
      expect(getEditorInterface.mock.calls).toHaveLength(0)
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
      expect(mockClient.getSpace.mock.calls).toHaveLength(1)
      expect(mockSpace.getEnvironment.mock.calls).toHaveLength(1)
      expect(mockEnvironment.getContentTypes.mock.calls).toHaveLength(1)
      expect(mockEnvironment.getContentTypes.mock.calls[0][0].limit).toBe(1000)
      expect(getEditorInterface.mock.calls).toHaveLength(resultItemCount)
      expect(response.data.contentTypes).toHaveLength(resultItemCount)
      expect(response.data.editorInterfaces).toHaveLength(resultItemCount)
    })
})

test('Query entry/asset respect limit query param', () => {
  // overwrite the getAssets mock so maxItems is larger than default page size in pagedGet (get-space-data.js)
  mockEnvironment.getAssets = jest.fn((query) => {
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
      expect(mockClient.getSpace.mock.calls).toHaveLength(1)
      expect(mockSpace.getEnvironment.mock.calls).toHaveLength(1)
      expect(mockEnvironment.getEntries.mock.calls[0][0].limit).toBe(20)
      expect(mockEnvironment.getAssets.mock.calls[0][0].limit).toBe(1000) // assets should be called 2x
      expect(mockEnvironment.getAssets.mock.calls[1][0].limit).toBe(1) // because it has to fetch the final item in the second page
      expect(response.data.assets).toHaveLength(1001)
      expect(response.data.entries).toHaveLength(20)
    })
})

test('only skips fetched items', () => {
  // overwrite the getLocales only returns 20 items in pages of 10
  mockEnvironment.getLocales = jest.fn()
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
      expect(mockClient.getSpace.mock.calls).toHaveLength(1)
      expect(mockSpace.getEnvironment.mock.calls).toHaveLength(1)
      expect(mockEnvironment.getLocales.mock.calls).toHaveLength(2)
      expect(mockEnvironment.getLocales.mock.calls[0][0].limit).toBe(1000)
      expect(mockEnvironment.getLocales.mock.calls[0][0].skip).toBe(0)
      expect(mockEnvironment.getLocales.mock.calls[1][0].limit).toBe(1000)
      expect(mockEnvironment.getLocales.mock.calls[1][0].skip).toBe(10)
    })
})

test('halts fetching when no items in page', () => {
  // overwrite the getLocales returns 0 items
  mockEnvironment.getLocales = jest.fn()
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
      expect(mockClient.getSpace.mock.calls).toHaveLength(1)
      expect(mockSpace.getEnvironment.mock.calls).toHaveLength(1)
      expect(mockEnvironment.getLocales.mock.calls).toHaveLength(1)
      expect(mockEnvironment.getLocales.mock.calls[0][0].limit).toBe(1000)
      expect(mockEnvironment.getLocales.mock.calls[0][0].skip).toBe(0)
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

// --- Experience Orchestration (ExO) entities ---
//
// The ExO tasks are driven by the plain CMA client and cursor-based pagination.
// They are gated behind `includeExperienceOrchestration` and are always skipped
// unless it is enabled. These tests pin down the endpoint names, the exported
// field names, pagination, and graceful degradation — the behaviour renamed
// when the entities became Component / Experience Fragment / Experience
// Template.

// Maps each exported field on `ctx.data` to the plain-client endpoint that must
// back it. Deprecated endpoints (componentType/fragment/template) must NOT be
// used — that is the core regression this suite guards.
const exoEndpoints = {
  designTokens: 'designToken',
  components: 'component',
  experienceTemplates: 'experienceTemplate',
  dataAssemblies: 'dataAssembly',
  experienceFragments: 'experienceFragment',
  experiences: 'experience'
}

const deprecatedExoEndpoints = ['componentType', 'template', 'fragment']

function cursorPage (items, next = null) {
  return { items, pages: next ? { next } : {} }
}

const mockPlainClient = {}

function setupExoMocks () {
  // Each ExO endpoint returns a single page whose lone item's id encodes the
  // endpoint, so we can assert the right endpoint feeds the right field.
  Object.entries(exoEndpoints).forEach(([, endpoint]) => {
    mockPlainClient[endpoint] = {
      getMany: jest.fn(() => Promise.resolve(cursorPage([{ sys: { id: endpoint } }])))
    }
  })
  // Deprecated endpoints are present as spies so we can assert they are never hit.
  deprecatedExoEndpoints.forEach((endpoint) => {
    mockPlainClient[endpoint] = {
      getMany: jest.fn(() => Promise.resolve(cursorPage([{ sys: { id: endpoint } }])))
    }
  })
}

test('Skips all ExO entities by default', () => {
  setupExoMocks()
  return getSpaceData({
    client: mockClient,
    plainClient: mockPlainClient,
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
      Object.entries(exoEndpoints).forEach(([field, endpoint]) => {
        expect(mockPlainClient[endpoint].getMany.mock.calls).toHaveLength(0)
        expect(response.data[field]).toBeUndefined()
      })
    })
})

test('Fetches all ExO entities into their renamed fields via the non-deprecated endpoints', () => {
  setupExoMocks()
  return getSpaceData({
    client: mockClient,
    plainClient: mockPlainClient,
    spaceId: 'spaceid',
    maxAllowedLimit,
    skipContent: true,
    skipWebhooks: true,
    skipRoles: true,
    includeExperienceOrchestration: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      Object.entries(exoEndpoints).forEach(([field, endpoint]) => {
        // Correct endpoint called exactly once (single page)...
        expect(mockPlainClient[endpoint].getMany.mock.calls).toHaveLength(1)
        // ...with the space/environment scoped cursor query.
        expect(mockPlainClient[endpoint].getMany.mock.calls[0][0]).toEqual({
          spaceId: 'spaceid',
          environmentId: 'master',
          limit: maxAllowedLimit
        })
        // ...and its result lands on the correctly-named field.
        expect(response.data[field]).toHaveLength(1)
        expect(response.data[field][0].sys.id).toBe(endpoint)
      })
      // The deprecated endpoints must never be touched.
      deprecatedExoEndpoints.forEach((endpoint) => {
        expect(mockPlainClient[endpoint].getMany.mock.calls).toHaveLength(0)
      })
    })
})

test('Follows cursor pagination across pages and aggregates ExO items', () => {
  setupExoMocks()
  // Make components span two pages driven by a `pages.next` token.
  mockPlainClient.component.getMany = jest.fn()
    .mockResolvedValueOnce(cursorPage([{ sys: { id: 'c1' } }, { sys: { id: 'c2' } }], 'CURSOR_PAGE_2'))
    .mockResolvedValueOnce(cursorPage([{ sys: { id: 'c3' } }]))

  return getSpaceData({
    client: mockClient,
    plainClient: mockPlainClient,
    spaceId: 'spaceid',
    maxAllowedLimit,
    skipContent: true,
    skipWebhooks: true,
    skipRoles: true,
    includeExperienceOrchestration: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(mockPlainClient.component.getMany.mock.calls).toHaveLength(2)
      // First page carries no cursor token.
      expect(mockPlainClient.component.getMany.mock.calls[0][0]).toEqual({
        spaceId: 'spaceid',
        environmentId: 'master',
        limit: maxAllowedLimit
      })
      // Second page passes the `pageNext` token returned by the first.
      expect(mockPlainClient.component.getMany.mock.calls[1][0]).toEqual({
        spaceId: 'spaceid',
        environmentId: 'master',
        limit: maxAllowedLimit,
        pageNext: 'CURSOR_PAGE_2'
      })
      expect(response.data.components).toHaveLength(3)
      expect(response.data.components.map((item) => item.sys.id)).toEqual(['c1', 'c2', 'c3'])
    })
})

test('Passes the target environment through to ExO endpoints', () => {
  setupExoMocks()
  return getSpaceData({
    client: mockClient,
    plainClient: mockPlainClient,
    spaceId: 'spaceid',
    environmentId: 'staging',
    maxAllowedLimit,
    skipContent: true,
    skipWebhooks: true,
    skipRoles: true,
    includeExperienceOrchestration: true
  })
    .run({
      data: {}
    })
    .then(() => {
      expect(mockPlainClient.component.getMany.mock.calls[0][0].environmentId).toBe('staging')
      expect(mockPlainClient.experienceFragment.getMany.mock.calls[0][0].environmentId).toBe('staging')
    })
})

test('Degrades gracefully to an empty array when an ExO endpoint fails', () => {
  setupExoMocks()
  // One endpoint rejects (e.g. space lacks the exo_m1 entitlement); the rest succeed.
  mockPlainClient.component.getMany = jest.fn(() => Promise.reject(new Error('missing entitlement')))

  return getSpaceData({
    client: mockClient,
    plainClient: mockPlainClient,
    spaceId: 'spaceid',
    maxAllowedLimit,
    skipContent: true,
    skipWebhooks: true,
    skipRoles: true,
    includeExperienceOrchestration: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      // Failing endpoint yields [] rather than aborting the whole export...
      expect(response.data.components).toEqual([])
      // ...and the remaining ExO entities are still exported.
      expect(response.data.experienceFragments).toHaveLength(1)
      expect(response.data.experienceTemplates).toHaveLength(1)
      expect(response.data.dataAssemblies).toHaveLength(1)
      expect(response.data.experiences).toHaveLength(1)
      expect(response.data.designTokens).toHaveLength(1)
    })
})
