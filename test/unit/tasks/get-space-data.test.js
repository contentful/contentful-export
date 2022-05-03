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

const mockEntry = { metadata: { tags: [] } }

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
    return Promise.resolve(pagedContentResult(query, resultItemCount))
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
