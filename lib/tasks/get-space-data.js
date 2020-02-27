import Promise from 'bluebird'
import Listr from 'listr'
import verboseRenderer from 'listr-verbose-renderer'

import { wrapTask } from 'contentful-batch-libs/dist/listr'
import { logEmitter } from 'contentful-batch-libs/dist/logging'

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
      task: wrapTask((ctx, task) => {
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
      task: wrapTask((ctx, task) => {
        return pagedGet({source: ctx.environment, method: 'getContentTypes'})
          .then(extractItems)
          .then((items) => {
            ctx.data.contentTypes = items
          })
      }),
      skip: () => skipContentModel
    },
    {
      title: 'Fetching editor interfaces data',
      task: wrapTask((ctx, task) => {
        return getEditorInterfaces(ctx.data.contentTypes)
          .then((editorInterfaces) => {
            ctx.data.editorInterfaces = editorInterfaces.filter((editorInterface) => {
              return editorInterface !== null
            })
          })
      }),
      skip: (ctx) => skipContentModel || (ctx.data.contentTypes.length === 0 && 'Skipped since no content types downloaded')
    },
    {
      title: 'Fetching content entries data',
      task: wrapTask((ctx, task) => {
        const source = cdaClient || ctx.environment
        if (cdaClient) {
          // let's not fetch children when using Content Delivery API
          queryEntries = queryEntries || {}
          queryEntries.include = 0
          queryEntries.locale = '*'
        }
        return pagedGet({source, method: 'getEntries', query: queryEntries})
          .then(extractItems)
          .then((items) => filterDrafts(items, includeDrafts, cdaClient))
          .then((items) => filterArchived(items, includeArchived))
          .then((items) => {
            ctx.data.entries = items
          })
      }),
      skip: () => skipContent
    },
    {
      title: 'Fetching assets data',
      task: wrapTask((ctx, task) => {
        const source = cdaClient || ctx.environment
        return pagedGet({source, method: 'getAssets', query: queryAssets})
          .then(extractItems)
          .then((items) => filterDrafts(items, includeDrafts, cdaClient))
          .then((items) => filterArchived(items, includeArchived))
          .then((items) => {
            ctx.data.assets = items
          })
      }),
      skip: () => skipContent
    },
    {
      title: 'Fetching locales data',
      task: wrapTask((ctx, task) => {
        return pagedGet({source: ctx.environment, method: 'getLocales'})
          .then(extractItems)
          .then((items) => {
            ctx.data.locales = items
          })
      }),
      skip: () => skipContentModel
    },
    {
      title: 'Fetching webhooks data',
      task: wrapTask((ctx, task) => {
        return pagedGet({source: ctx.space, method: 'getWebhooks'})
          .then(extractItems)
          .then((items) => {
            ctx.data.webhooks = items
          })
      }),
      skip: () => skipWebhooks || (environmentId !== 'master' && 'Webhooks can only be exported from master environment')
    },
    {
      title: 'Fetching roles data',
      task: wrapTask((ctx, task) => {
        return pagedGet({source: ctx.space, method: 'getRoles'})
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
  return Promise.map(contentTypes, (contentType, index, length) => {
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
function pagedGet ({source, method, skip = 0, aggregatedResponse = null, query = null}) {
  const fullQuery = Object.assign({},
    {
      skip: skip,
      limit: pageLimit,
      order: 'sys.createdAt,sys.id'
    },
    query
  )

  return source[method](fullQuery)
    .then((response) => {
      if (!aggregatedResponse) {
        aggregatedResponse = response
      } else {
        aggregatedResponse.items = aggregatedResponse.items.concat(response.items)
      }
      const page = Math.ceil(skip / pageLimit) + 1
      const pages = Math.ceil(response.total / pageLimit)
      logEmitter.emit('info', `Fetched ${aggregatedResponse.items.length} of ${response.total} items (Page ${page}/${pages})`)
      if (skip + pageLimit <= response.total) {
        return pagedGet({source, method, skip: skip + pageLimit, aggregatedResponse, query})
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
