import Promise from 'bluebird'
import { logEmitter, wrapTask } from 'contentful-batch-libs'
import Listr from 'listr'
import verboseRenderer from 'listr-verbose-renderer'

const MAX_ALLOWED_LIMIT = 1000
let pageLimit = MAX_ALLOWED_LIMIT

/**
 * Gets all the content from a space via the management API. This includes
 * content in draft state.
 */
export default function getFullSourceSpace ({
  client,
  cdaClient,
  spaceId,
  environmentId = 'master',
  skipContentModel,
  skipContent,
  skipWebhooks,
  skipRoles,
  skipEditorInterfaces,
  skipTags,
  stripTags,
  includeDrafts,
  includeArchived,
  maxAllowedLimit,
  listrOptions,
  queryEntries,
  queryAssets
}) {
  pageLimit = maxAllowedLimit || MAX_ALLOWED_LIMIT
  listrOptions = listrOptions || {
    renderer: verboseRenderer
  }

  return new Listr([
    {
      title: 'Connecting to space',
      task: wrapTask((ctx) => {
        return client.getSpace(spaceId)
          .then((space) => {
            ctx.space = space
            return space.getEnvironment(environmentId)
          })
          .then((environment) => {
            ctx.environment = environment
          })
      })
    },
    {
      title: 'Fetching content types data',
      task: wrapTask((ctx) => {
        return pagedGet({ source: ctx.environment, method: 'getContentTypes' })
          .then(extractItems)
          .then((items) => {
            ctx.data.contentTypes = items
          })
      }),
      skip: () => skipContentModel
    },
    {
      title: 'Fetching tags data',
      task: wrapTask((ctx) => {
        return pagedGet({ source: ctx.environment, method: 'getTags' })
          .then(extractItems)
          .then((items) => {
            ctx.data.tags = items
          })
          .catch(() => {
            ctx.data.tags = []
          })
      }),
      skip: () => skipTags
    },
    {
      title: 'Fetching editor interfaces data',
      task: wrapTask((ctx) => {
        return getEditorInterfaces(ctx.data.contentTypes)
          .then((editorInterfaces) => {
            ctx.data.editorInterfaces = editorInterfaces.filter((editorInterface) => {
              return editorInterface !== null
            })
          })
      }),
      skip: (ctx) => skipContentModel || skipEditorInterfaces || (ctx.data.contentTypes.length === 0 && 'Skipped since no content types downloaded')
    },
    {
      title: 'Fetching content entries data',
      task: wrapTask((ctx) => {
        const source = cdaClient?.withAllLocales || ctx.environment
        if (cdaClient) {
          // let's not fetch children when using Content Delivery API
          queryEntries = queryEntries || {}
          queryEntries.include = 0
        }
        return pagedGet({ source, method: 'getEntries', query: queryEntries })
          .then(extractItems)
          .then((items) => filterDrafts(items, includeDrafts, cdaClient))
          .then((items) => filterArchived(items, includeArchived))
          .then((items) => removeTags(items, stripTags))
          .then((items) => {
            ctx.data.entries = items
          })
      }),
      skip: () => skipContent
    },
    {
      title: 'Fetching assets data',
      task: wrapTask((ctx) => {
        const source = cdaClient?.withAllLocales || ctx.environment
        queryAssets = queryAssets || {}
        return pagedGet({ source, method: 'getAssets', query: queryAssets })
          .then(extractItems)
          .then((items) => filterDrafts(items, includeDrafts, cdaClient))
          .then((items) => filterArchived(items, includeArchived))
          .then((items) => removeTags(items, stripTags))
          .then((items) => {
            ctx.data.assets = items
          })
      }),
      skip: () => skipContent
    },
    {
      title: 'Fetching locales data',
      task: wrapTask((ctx) => {
        // locale API limits to pages of 100
        return pagedGet({ source: ctx.environment, method: 'getLocales', query: { limit: 100 } })
          .then(extractItems)
          .then((items) => {
            ctx.data.locales = items
          })
      }),
      skip: () => skipContentModel
    },
    {
      title: 'Fetching webhooks data',
      task: wrapTask((ctx) => {
        return pagedGet({ source: ctx.space, method: 'getWebhooks' })
          .then(extractItems)
          .then((items) => {
            ctx.data.webhooks = items
          })
      }),
      skip: () => skipWebhooks || (environmentId !== 'master' && 'Webhooks can only be exported from master environment')
    },
    {
      title: 'Fetching roles data',
      task: wrapTask((ctx) => {
        return pagedGet({ source: ctx.space, method: 'getRoles' })
          .then(extractItems)
          .then((items) => {
            ctx.data.roles = items
          })
      }),
      skip: () => skipRoles || (environmentId !== 'master' && 'Roles can only be exported from master environment')
    }
  ], listrOptions)
}

function getEditorInterfaces (contentTypes) {
  return Promise.map(contentTypes, (contentType) => {
    return contentType.getEditorInterface()
      .then((editorInterface) => {
        logEmitter.emit('info', `Fetched editor interface for ${contentType.name}`)
        return editorInterface
      })
      .catch(() => {
      // old contentTypes may not have an editor interface but we'll handle in a later stage
      // but it should not stop getting the data process
        logEmitter.emit('warning', `No editor interface found for ${contentType}`)
        return Promise.resolve(null)
      })
  }, {
    concurrency: 6
  })
}

/**
 * Gets all the existing entities based on pagination parameters.
 * The first call will have no aggregated response. Subsequent calls will
 * concatenate the new responses to the original one.
 */
function pagedGet ({ source, method, skip = 0, aggregatedResponse = null, query = null }) {
  const queryLimit = query && query.limit
  const imposedLimit = queryLimit && queryLimit < pageLimit ? queryLimit : pageLimit
  const fullQuery = Object.assign({},
    {
      skip,
      order: 'sys.createdAt,sys.id'
    },
    query,
    {
      limit: imposedLimit
    }
  )

  return source[method](fullQuery)
    .then((response) => {
      if (!aggregatedResponse) {
        aggregatedResponse = response
      } else {
        aggregatedResponse.items = aggregatedResponse.items.concat(response.items)
      }
      const total = response.total
      const page = Math.ceil(skip / imposedLimit) + 1
      const pages = Math.ceil(total / imposedLimit)
      logEmitter.emit('info', `Fetched ${aggregatedResponse.items.length} of ${total} items (Page ${page}/${pages})`)
      if (aggregatedResponse.items.length < total) {
        return pagedGet({ source, method, skip: skip + imposedLimit, aggregatedResponse, query })
      }
      return aggregatedResponse
    })
}

function extractItems (response) {
  return response.items
}

function filterDrafts (items, includeDrafts, cdaClient) {
  // CDA filters drafts based on host, no need to do filtering here
  return (includeDrafts || cdaClient) ? items : items.filter((item) => !!item.sys.publishedVersion || !!item.sys.archivedVersion)
}

function filterArchived (items, includeArchived) {
  return includeArchived ? items : items.filter((item) => !item.sys.archivedVersion)
}

function removeTags (items, stripTags) {
  if (stripTags) {
    items.forEach(item => {
      if (item.metadata?.tags) {
        item.metadata.tags = []
      }
    })
  }
  return items
}
