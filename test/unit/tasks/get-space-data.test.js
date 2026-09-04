import { logEmitter } from 'contentful-batch-libs'
import getSpaceData from '../../../lib/tasks/get-space-data'

const maxAllowedLimit = 100
const resultItemCount = 420

function pagedResult(query, maxItems, mock = {}) {
  const { skip, limit } = query
  const cnt = maxItems - skip > limit ? limit : maxItems - skip
  return {
    items: Array.from({ length: cnt }, (n) => {
      const id = n * skip + 1
      return Object.assign({ sys: { id } }, mock)
    }),
    total: maxItems
  }
}

function pagedContentResult(query, maxItems, mock = {}) {
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
  tag: {},
  editorInterface: {},
  entry: {},
  asset: {},
  locale: {},
  webhook: {},
  role: {}
}

const mockAsset = { metadata: { tags: [{}] } }
const mockEntry = { metadata: { tags: [{}] } }

function setupMocks() {
  mockClient.space.get = jest.fn(() => Promise.resolve({ sys: { id: 'spaceid' } }))
  mockClient.environment.get = jest.fn(() => Promise.resolve({ sys: { id: 'master' } }))
  mockClient.contentType.getMany = jest.fn(({ query }) => {
    return Promise.resolve(pagedResult(query, resultItemCount, {
      sys: { id: 'ctId' },
      name: 'ctName'
    }))
  })
  mockClient.entry.getMany = jest.fn(({ query }) => {
    return Promise.resolve(pagedContentResult(query, resultItemCount, mockEntry))
  })
  mockClient.asset.getMany = jest.fn(({ query }) => {
    return Promise.resolve(pagedContentResult(query, resultItemCount, mockAsset))
  })
  mockClient.locale.getMany = jest.fn(({ query }) => {
    return Promise.resolve(pagedResult(query, resultItemCount))
  })
  mockClient.tag.getMany = jest.fn(({ query }) => {
    return Promise.resolve(pagedResult(query, resultItemCount))
  })
  mockClient.webhook.getMany = jest.fn(() => {
    return Promise.resolve({ items: Array.from({ length: resultItemCount }, (_, i) => ({ sys: { id: i } })), total: resultItemCount })
  })
  mockClient.role.getMany = jest.fn(() => {
    return Promise.resolve({ items: Array.from({ length: resultItemCount }, (_, i) => ({ sys: { id: i } })), total: resultItemCount })
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
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(1)
      expect(mockClient.role.getMany.mock.calls).toHaveLength(1)
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
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(1)
      expect(mockClient.role.getMany.mock.calls).toHaveLength(1)
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
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(1)
      expect(mockClient.role.getMany.mock.calls).toHaveLength(1)
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
      expect(mockClient.space.get.mock.calls).toHaveLength(1)
      expect(mockClient.environment.get.mock.calls).toHaveLength(1)
      expect(mockClient.contentType.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.entry.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.asset.getMany.mock.calls).toHaveLength(0)
      expect(mockClient.locale.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.tag.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(1)
      expect(mockClient.role.getMany.mock.calls).toHaveLength(1)
      expect(mockClient.editorInterface.get.mock.calls).toHaveLength(resultItemCount)
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
      expect(mockClient.space.get.mock.calls).toHaveLength(1)
      expect(mockClient.environment.get.mock.calls).toHaveLength(1)
      expect(mockClient.contentType.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.entry.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.asset.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.locale.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.tag.getMany.mock.calls).toHaveLength(Math.ceil(resultItemCount / maxAllowedLimit))
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(0)
      expect(mockClient.role.getMany.mock.calls).toHaveLength(1)
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
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(1)
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
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(1)
      expect(mockClient.role.getMany.mock.calls).toHaveLength(1)
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
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(1)
      expect(mockClient.role.getMany.mock.calls).toHaveLength(1)
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

test('Aborts the export when fetching tags fails', () => {
  mockClient.tag.getMany = jest.fn(() => Promise.reject(new Error('tags service unavailable')))

  // Production always calls setupLogging() before any task runs, which
  // registers a permanent 'error' listener. Without one, Node treats a
  // listener-less 'error' emit as unhandled and throws its own wrapper error.
  const errors = []
  const onError = (err) => errors.push(err)
  logEmitter.on('error', onError)

  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    maxAllowedLimit
  })
    .run({
      data: {}
    })
    .then(
      () => Promise.reject(new Error('Expected the export to reject when tags fails')),
      (err) => {
        expect(err.message).toContain('tags service unavailable')
        expect(errors).toHaveLength(1)
        expect(errors[0].message).toBe('Fetching tags failed: tags service unavailable')
        expect(errors[0].cause.message).toBe('tags service unavailable')
      }
    )
    .finally(() => {
      logEmitter.off('error', onError)
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
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(1)
      expect(mockClient.role.getMany.mock.calls).toHaveLength(1)
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
      expect(mockClient.webhook.getMany.mock.calls).toHaveLength(1)
      expect(mockClient.role.getMany.mock.calls).toHaveLength(1)
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

test('Logs the content type name, or falls back to sys.id, when no editor interface is found', () => {
  mockClient.editorInterface.get = jest.fn(() => Promise.reject(new Error('No editor interface found')))
  mockClient.contentType.getMany = jest.fn(() => Promise.resolve({
    items: [
      { sys: { id: 'named-content-type' }, name: 'Named Content Type' },
      { sys: { id: 'unnamed-content-type' } }
    ],
    total: 2
  }))

  const warnings = []
  const onWarning = (message) => warnings.push(message)
  logEmitter.on('warning', onWarning)

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
      expect(response.data.editorInterfaces).toHaveLength(0)
      expect(warnings).toContain('No editor interface found for Named Content Type')
      expect(warnings).toContain('No editor interface found for unnamed-content-type')
      expect(warnings.some((message) => message.includes('[object Object]'))).toBe(false)
    })
    .finally(() => {
      logEmitter.off('warning', onWarning)
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
      expect(mockClient.contentType.getMany.mock.calls[0][0].query.limit).toBe(1000)
      expect(mockClient.editorInterface.get.mock.calls).toHaveLength(resultItemCount)
      expect(response.data.contentTypes).toHaveLength(resultItemCount)
      expect(response.data.editorInterfaces).toHaveLength(resultItemCount)
    })
})

test('Query entry/asset respect limit query param', () => {
  // overwrite the getAssets mock so maxItems is larger than default page size in pagedGet (get-space-data.js)
  mockClient.asset.getMany = jest.fn(({ query }) => {
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
      expect(mockClient.entry.getMany.mock.calls[0][0].query.limit).toBe(20)
      expect(mockClient.asset.getMany.mock.calls[0][0].query.limit).toBe(1000) // assets should be called 2x
      expect(mockClient.asset.getMany.mock.calls[1][0].query.limit).toBe(1) // because it has to fetch the final item in the second page
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
      expect(mockClient.locale.getMany.mock.calls[0][0].query.limit).toBe(1000)
      expect(mockClient.locale.getMany.mock.calls[0][0].query.skip).toBe(0)
      expect(mockClient.locale.getMany.mock.calls[1][0].query.limit).toBe(1000)
      expect(mockClient.locale.getMany.mock.calls[1][0].query.skip).toBe(10)
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
      expect(mockClient.locale.getMany.mock.calls[0][0].query.limit).toBe(1000)
      expect(mockClient.locale.getMany.mock.calls[0][0].query.skip).toBe(0)
    })
})

test('Roles fetch paginates via skip/limit and does not duplicate or drop items across pages', () => {
  // overwrite the getRoles mock to return 60 roles in pages of 25, matching the
  // API's default page size, to reproduce the reported duplication bug
  mockClient.role.getMany = jest.fn()
    .mockResolvedValueOnce({
      items: Array.from({ length: 25 }, (_, i) => ({ sys: { id: i + 1 } })),
      total: 60
    })
    .mockResolvedValueOnce({
      items: Array.from({ length: 25 }, (_, i) => ({ sys: { id: i + 26 } })),
      total: 60
    })
    .mockResolvedValueOnce({
      items: Array.from({ length: 10 }, (_, i) => ({ sys: { id: i + 51 } })),
      total: 60
    })
  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    skipContent: true,
    skipContentModel: true,
    skipWebhooks: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(mockClient.role.getMany.mock.calls).toHaveLength(3)
      expect(mockClient.role.getMany.mock.calls[0][0]).toEqual({ spaceId: 'spaceid', query: { limit: 1000, order: 'sys.createdAt,sys.id' } })
      expect(mockClient.role.getMany.mock.calls[1][0]).toEqual({ spaceId: 'spaceid', query: { limit: 1000, order: 'sys.createdAt,sys.id', skip: 25 } })
      expect(mockClient.role.getMany.mock.calls[2][0]).toEqual({ spaceId: 'spaceid', query: { limit: 1000, order: 'sys.createdAt,sys.id', skip: 50 } })
      expect(response.data.roles).toHaveLength(60)
      expect(response.data.roles.map((role) => role.sys.id)).toEqual(
        Array.from({ length: 60 }, (_, i) => i + 1)
      )
    })
})

test('Roles fetch follows cursor-based pagination when the API returns pages.next', () => {
  // reproduces the post-Feb-2027 API shape: https://www.contentful.com/developers/api-changes/space-roles-collection-endpoints-update/
  mockClient.role.getMany = jest.fn()
    .mockResolvedValueOnce({
      items: [{ sys: { id: 'r1' } }, { sys: { id: 'r2' } }],
      pages: { next: 'CURSOR_PAGE_2' }
    })
    .mockResolvedValueOnce({
      items: [{ sys: { id: 'r3' } }],
      pages: {}
    })
  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    skipContent: true,
    skipContentModel: true,
    skipWebhooks: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(mockClient.role.getMany.mock.calls).toHaveLength(2)
      expect(mockClient.role.getMany.mock.calls[0][0]).toEqual({ spaceId: 'spaceid', query: { limit: 1000, order: 'sys.createdAt,sys.id' } })
      expect(mockClient.role.getMany.mock.calls[1][0]).toEqual({ spaceId: 'spaceid', query: { limit: 1000, order: 'sys.createdAt,sys.id', pageNext: 'CURSOR_PAGE_2' } })
      expect(response.data.roles.map((role) => role.sys.id)).toEqual(['r1', 'r2', 'r3'])
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

function cursorPage(items, next = null) {
  return { items, pages: next ? { next } : {} }
}

function setupExoMocks() {
  // Each ExO endpoint returns a single page whose lone item's id encodes the
  // endpoint, so we can assert the right endpoint feeds the right field.
  Object.entries(exoEndpoints).forEach(([, endpoint]) => {
    mockClient[endpoint] = {
      getMany: jest.fn(() => Promise.resolve(cursorPage([{ sys: { id: endpoint } }])))
    }
  })
  // Deprecated endpoints are present as spies so we can assert they are never hit.
  deprecatedExoEndpoints.forEach((endpoint) => {
    mockClient[endpoint] = {
      getMany: jest.fn(() => Promise.resolve(cursorPage([{ sys: { id: endpoint } }])))
    }
  })
}

test('Skips all ExO entities by default', () => {
  setupExoMocks()
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
      Object.entries(exoEndpoints).forEach(([field, endpoint]) => {
        expect(mockClient[endpoint].getMany.mock.calls).toHaveLength(0)
        expect(response.data[field]).toBeUndefined()
      })
    })
})

test('Fetches all ExO entities into their renamed fields via the non-deprecated endpoints', () => {
  setupExoMocks()
  return getSpaceData({
    client: mockClient,
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
        expect(mockClient[endpoint].getMany.mock.calls).toHaveLength(1)
        // ...with the space/environment scoped cursor query.
        expect(mockClient[endpoint].getMany.mock.calls[0][0]).toEqual({
          spaceId: 'spaceid',
          environmentId: 'master',
          query: { limit: maxAllowedLimit }
        })
        // ...and its result lands on the correctly-named field.
        expect(response.data[field]).toHaveLength(1)
        expect(response.data[field][0].sys.id).toBe(endpoint)
      })
      // The deprecated endpoints must never be touched.
      deprecatedExoEndpoints.forEach((endpoint) => {
        expect(mockClient[endpoint].getMany.mock.calls).toHaveLength(0)
      })
    })
})

test('Follows cursor pagination across pages and aggregates ExO items', () => {
  setupExoMocks()
  // Make components span two pages driven by a `pages.next` token.
  mockClient.component.getMany = jest.fn()
    .mockResolvedValueOnce(cursorPage([{ sys: { id: 'c1' } }, { sys: { id: 'c2' } }], 'CURSOR_PAGE_2'))
    .mockResolvedValueOnce(cursorPage([{ sys: { id: 'c3' } }]))

  return getSpaceData({
    client: mockClient,
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
      expect(mockClient.component.getMany.mock.calls).toHaveLength(2)
      // First page carries no cursor token.
      expect(mockClient.component.getMany.mock.calls[0][0]).toEqual({
        spaceId: 'spaceid',
        environmentId: 'master',
        query: { limit: maxAllowedLimit }
      })
      // Second page passes the `pageNext` token returned by the first.
      expect(mockClient.component.getMany.mock.calls[1][0]).toEqual({
        spaceId: 'spaceid',
        environmentId: 'master',
        query: { limit: maxAllowedLimit, pageNext: 'CURSOR_PAGE_2' }
      })
      expect(response.data.components).toHaveLength(3)
      expect(response.data.components.map((item) => item.sys.id)).toEqual(['c1', 'c2', 'c3'])
    })
})

test('Passes the target environment through to ExO endpoints', () => {
  setupExoMocks()
  return getSpaceData({
    client: mockClient,
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
      expect(mockClient.component.getMany.mock.calls[0][0].environmentId).toBe('staging')
      expect(mockClient.experienceFragment.getMany.mock.calls[0][0].environmentId).toBe('staging')
    })
})

test('Degrades gracefully to an empty array when an ExO endpoint fails', () => {
  setupExoMocks()
  // One endpoint rejects (e.g. space lacks the exo_m1 entitlement); the rest succeed.
  mockClient.component.getMany = jest.fn(() => Promise.reject(new Error('missing entitlement')))

  return getSpaceData({
    client: mockClient,
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

// --- Optimization Variants ---
//
// Variants are nested onto their parent Experience/ExperienceFragment
// (`parent.optimizationVariants`), not exported as their own top-level field — see
// projects/decisions/0001-exo-variant-export-storage-shape.md (ecosystem-os repo).
// This is because a variant's `sys.id` is borrowed from its parent (not unique to
// the variant itself), so a flat array would collide; nesting sidesteps that by
// construction. These tests exist specifically to guard that nesting behavior and
// its gating.

function setupVariantMocks() {
  mockClient.experienceVariant = {
    getMany: jest.fn(() => Promise.resolve({ sys: { type: 'Array' }, items: [] }))
  }
  mockClient.experienceFragmentVariant = {
    getMany: jest.fn(() => Promise.resolve({ sys: { type: 'Array' }, items: [] }))
  }
}

test('Skips Optimization Variants by default even when ExO is enabled', () => {
  setupExoMocks()
  setupVariantMocks()
  return getSpaceData({
    client: mockClient,
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
      expect(mockClient.experienceVariant.getMany.mock.calls).toHaveLength(0)
      expect(mockClient.experienceFragmentVariant.getMany.mock.calls).toHaveLength(0)
      expect(response.data.experiences[0].optimizationVariants).toBeUndefined()
      expect(response.data.experienceFragments[0].optimizationVariants).toBeUndefined()
    })
})

test('Nests fetched variants onto their parent Experience/ExperienceFragment when includeExoVariants is true', () => {
  setupExoMocks()
  mockClient.experience.getMany = jest.fn(() => Promise.resolve(
    cursorPage([{ sys: { id: 'exp1' } }, { sys: { id: 'exp2' } }])
  ))
  mockClient.experienceFragment.getMany = jest.fn(() => Promise.resolve(
    cursorPage([{ sys: { id: 'frag1' } }])
  ))
  mockClient.experienceVariant = {
    getMany: jest.fn((params) => Promise.resolve({
      sys: { type: 'Array' },
      items: [{ sys: { id: params.experienceId, variant: `${params.experienceId}-v1` } }]
    }))
  }
  mockClient.experienceFragmentVariant = {
    getMany: jest.fn((params) => Promise.resolve({
      sys: { type: 'Array' },
      items: [{ sys: { id: params.experienceFragmentId, variant: `${params.experienceFragmentId}-v1` } }]
    }))
  }

  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    maxAllowedLimit,
    skipContent: true,
    skipWebhooks: true,
    skipRoles: true,
    includeExperienceOrchestration: true,
    includeExoVariants: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      // One call per parent (N+1), each scoped by that parent's ID via the
      // endpoint-specific param name (experienceId vs experienceFragmentId).
      expect(mockClient.experienceVariant.getMany.mock.calls).toHaveLength(2)
      expect(mockClient.experienceVariant.getMany.mock.calls[0][0]).toEqual({
        spaceId: 'spaceid',
        environmentId: 'master',
        experienceId: 'exp1',
        query: {}
      })
      expect(mockClient.experienceFragmentVariant.getMany.mock.calls).toHaveLength(1)
      expect(mockClient.experienceFragmentVariant.getMany.mock.calls[0][0]).toEqual({
        spaceId: 'spaceid',
        environmentId: 'master',
        experienceFragmentId: 'frag1',
        query: {}
      })
      // Variants land nested on their own parent, not as a top-level field, and
      // not cross-mixed between the two parents fetched in the same run.
      expect(response.data.experiences.find((e) => e.sys.id === 'exp1').optimizationVariants)
        .toEqual([{ sys: { id: 'exp1', variant: 'exp1-v1' } }])
      expect(response.data.experiences.find((e) => e.sys.id === 'exp2').optimizationVariants)
        .toEqual([{ sys: { id: 'exp2', variant: 'exp2-v1' } }])
      expect(response.data.experienceFragments[0].optimizationVariants)
        .toEqual([{ sys: { id: 'frag1', variant: 'frag1-v1' } }])
      expect(response.data.experienceVariants).toBeUndefined()
      expect(response.data.experienceFragmentVariants).toBeUndefined()
    })
})

test('Degrades gracefully to an empty array when a single parent\'s variant fetch fails', () => {
  setupExoMocks()
  mockClient.experience.getMany = jest.fn(() => Promise.resolve(
    cursorPage([{ sys: { id: 'exp1' } }, { sys: { id: 'exp2' } }])
  ))
  mockClient.experienceVariant = {
    getMany: jest.fn((params) => params.experienceId === 'exp1'
      ? Promise.reject(new Error('missing entitlement'))
      : Promise.resolve({ sys: { type: 'Array' }, items: [{ sys: { id: 'exp2', variant: 'exp2-v1' } }] }))
  }
  mockClient.experienceFragmentVariant = {
    getMany: jest.fn(() => Promise.resolve({ sys: { type: 'Array' }, items: [] }))
  }

  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    maxAllowedLimit,
    skipContent: true,
    skipWebhooks: true,
    skipRoles: true,
    includeExperienceOrchestration: true,
    includeExoVariants: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      // The failing parent gets [] rather than aborting the whole export...
      expect(response.data.experiences.find((e) => e.sys.id === 'exp1').optimizationVariants).toEqual([])
      // ...and the other parent's variants are still fetched.
      expect(response.data.experiences.find((e) => e.sys.id === 'exp2').optimizationVariants)
        .toEqual([{ sys: { id: 'exp2', variant: 'exp2-v1' } }])
    })
})

test('Skips Experience/Fragment variant fetch entirely when there are no parents to fetch for', () => {
  setupExoMocks()
  mockClient.experience.getMany = jest.fn(() => Promise.resolve(cursorPage([])))
  mockClient.experienceFragment.getMany = jest.fn(() => Promise.resolve(cursorPage([])))
  setupVariantMocks()

  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    maxAllowedLimit,
    skipContent: true,
    skipWebhooks: true,
    skipRoles: true,
    includeExperienceOrchestration: true,
    includeExoVariants: true
  })
    .run({
      data: {}
    })
    .then(() => {
      expect(mockClient.experienceVariant.getMany.mock.calls).toHaveLength(0)
      expect(mockClient.experienceFragmentVariant.getMany.mock.calls).toHaveLength(0)
    })
})

test('Filters out the API-synthesized default pseudo-variant, which represents the parent itself', () => {
  // The optimization_variants list endpoint always leads with a sys.variantType: 'default'
  // item representing the parent's own base view (a real record, or the baseline
  // Experience/Fragment itself if none exists) -- not a real personalization variant.
  // That entity is already exported as its own top-level Experience/ExperienceFragment, so
  // it must not also show up inside optimizationVariants (double-counting it as a variant).
  setupExoMocks()
  mockClient.experience.getMany = jest.fn(() => Promise.resolve(cursorPage([{ sys: { id: 'exp1' } }])))
  mockClient.experienceFragment.getMany = jest.fn(() => Promise.resolve(cursorPage([{ sys: { id: 'frag1' } }])))
  mockClient.experienceVariant = {
    getMany: jest.fn(() => Promise.resolve({
      sys: { type: 'Array' },
      items: [
        { sys: { id: 'exp1', variant: 'default', variantType: 'default' } },
        { sys: { id: 'exp1', variant: 'v1', variantType: 'personalization' } }
      ]
    }))
  }
  mockClient.experienceFragmentVariant = {
    // A parent with zero real variants still gets the synthesized default entry back --
    // filtering it must leave optimizationVariants empty, not length 1.
    getMany: jest.fn(() => Promise.resolve({
      sys: { type: 'Array' },
      items: [{ sys: { id: 'frag1', variant: 'default', variantType: 'default' } }]
    }))
  }

  return getSpaceData({
    client: mockClient,
    spaceId: 'spaceid',
    maxAllowedLimit,
    skipContent: true,
    skipWebhooks: true,
    skipRoles: true,
    includeExperienceOrchestration: true,
    includeExoVariants: true
  })
    .run({
      data: {}
    })
    .then((response) => {
      expect(response.data.experiences[0].optimizationVariants)
        .toEqual([{ sys: { id: 'exp1', variant: 'v1', variantType: 'personalization' } }])
      expect(response.data.experienceFragments[0].optimizationVariants).toEqual([])
    })
})
