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
export default function getFullSourceSpace({
  client,
  cdaClient,
  spaceId,
  environmentId = 'master',
  skipContentModel,
  skipContent,
  skipAssets,
  skipWebhooks,
  skipRoles,
  skipEditorInterfaces,
  skipTags,
  stripTags,
  includeDrafts,
  includeArchived,
  maxAllowedLimit,
  includeExperienceOrchestration,
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
      title: 'Connecting to space/environment',
      task: wrapTask(async () => {
        try {
          await client.space.get({ spaceId })
        } catch (err) {
          throw new Error(`Unable to retrieve space ${spaceId}, please ensure the space exists and the token is valid. (${err.message})`)
        }
        try {
          await client.environment.get({ spaceId, environmentId })
        } catch (err) {
          throw new Error(`Unable to retrieve environment ${environmentId}, please ensure the environment exists and the token is valid. (${err.message})`)
        }
      })
    },
    {
      title: 'Fetching content types data',
      task: wrapTask((ctx) => {
        return pagedGet((query) => client.contentType.getMany({ spaceId, environmentId, query }))
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
        return pagedGet((query) => client.tag.getMany({ spaceId, environmentId, query }))
          .then(extractItems)
          .then((items) => {
            ctx.data.tags = items
          })
          .catch((err) => {
            logEmitter.emit('error', new Error(`Fetching tags failed: ${err.message}`, { cause: err }))
            throw err
          })
      }),
      skip: () => skipTags
    },
    {
      title: 'Fetching editor interfaces data',
      task: wrapTask((ctx) => {
        return getEditorInterfaces(client, spaceId, environmentId, ctx.data.contentTypes)
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
        if (cdaClient) {
          // let's not fetch children when using Content Delivery API
          queryEntries = queryEntries || {}
          queryEntries.include = 0
        }
        const fetchFn = cdaClient
          ? (query) => cdaClient.withAllLocales.getEntries(query)
          : (query) => client.entry.getMany({ spaceId, environmentId, query })
        return pagedGet(fetchFn, queryEntries)
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
        queryAssets = queryAssets || {}
        const fetchFn = cdaClient
          ? (query) => cdaClient.withAllLocales.getAssets(query)
          : (query) => client.asset.getMany({ spaceId, environmentId, query })
        return pagedGet(fetchFn, queryAssets)
          .then(extractItems)
          .then((items) => filterDrafts(items, includeDrafts, cdaClient))
          .then((items) => filterArchived(items, includeArchived))
          .then((items) => removeTags(items, stripTags))
          .then((items) => {
            ctx.data.assets = items
          })
      }),
      skip: () => skipContent || skipAssets
    },
    {
      title: 'Fetching locales data',
      task: wrapTask((ctx) => {
        return pagedGet((query) => client.locale.getMany({ spaceId, environmentId, query }))
          .then(extractItems)
          .then((items) => {
            ctx.data.locales = items
          })
      }),
      skip: () => skipContentModel
    },
    {
      title: 'Fetching webhooks data',
      task: wrapTask(async (ctx) => {
        const webhooksResponse = await client.webhook.getMany({
          query: {
            // webhooks are capped to 100 per space
            limit: 100
          },
          spaceId
        })
        ctx.data.webhooks = webhooksResponse.items
      }),
      skip: () => skipWebhooks || (environmentId !== 'master' && 'Webhooks can only be exported from master environment')
    },
    {
      title: 'Fetching roles data',
      task: wrapTask(async (ctx) => {
        ctx.data.roles = await pagedRolesGet({ client, spaceId })
      }),
      skip: () => skipRoles || (environmentId !== 'master' && 'Roles can only be exported from master environment')
    },
    {
      title: 'Fetching Design Tokens data',
      task: wrapTask(async (ctx) => {
        try {
          ctx.data.designTokens = await cursorPagedGet((query) => client.designToken.getMany({ spaceId, environmentId, query }), 'designToken')
        } catch (err) {
          logEmitter.emit('warning', `Skipping Design Tokens export: ${err.message}`)
          ctx.data.designTokens = []
        }
      }),
      skip: () => !includeExperienceOrchestration
    },
    {
      title: 'Fetching Components data',
      task: wrapTask(async (ctx) => {
        try {
          ctx.data.components = await cursorPagedGet((query) => client.component.getMany({ spaceId, environmentId, query }), 'component')
        } catch (err) {
          logEmitter.emit('warning', `Skipping Components export: ${err.message}`)
          ctx.data.components = []
        }
      }),
      skip: () => !includeExperienceOrchestration
    },
    {
      title: 'Fetching Experience Templates data',
      task: wrapTask(async (ctx) => {
        try {
          ctx.data.experienceTemplates = await cursorPagedGet((query) => client.experienceTemplate.getMany({ spaceId, environmentId, query }), 'experienceTemplate')
        } catch (err) {
          logEmitter.emit('warning', `Skipping Experience Templates export: ${err.message}`)
          ctx.data.experienceTemplates = []
        }
      }),
      skip: () => !includeExperienceOrchestration
    },
    {
      title: 'Fetching Data Assemblies data',
      task: wrapTask(async (ctx) => {
        try {
          ctx.data.dataAssemblies = await cursorPagedGet((query) => client.dataAssembly.getMany({ spaceId, environmentId, query }), 'dataAssembly')
        } catch (err) {
          logEmitter.emit('warning', `Skipping Data Assemblies export: ${err.message}`)
          ctx.data.dataAssemblies = []
        }
      }),
      skip: () => !includeExperienceOrchestration
    },
    {
      title: 'Fetching Experience Fragments data',
      task: wrapTask(async (ctx) => {
        try {
          ctx.data.experienceFragments = await cursorPagedGet((query) => client.experienceFragment.getMany({ spaceId, environmentId, query }), 'experienceFragment')
        } catch (err) {
          logEmitter.emit('warning', `Skipping Experience Fragments export: ${err.message}`)
          ctx.data.experienceFragments = []
        }
      }),
      skip: () => !includeExperienceOrchestration
    },
    {
      title: 'Fetching Experiences data',
      task: wrapTask(async (ctx) => {
        try {
          ctx.data.experiences = await cursorPagedGet((query) => client.experience.getMany({ spaceId, environmentId, query }), 'experience')
        } catch (err) {
          logEmitter.emit('warning', `Skipping Experiences export: ${err.message}`)
          ctx.data.experiences = []
        }
      }),
      skip: () => !includeExperienceOrchestration
    }
  ], listrOptions)
}

function getEditorInterfaces(client, spaceId, environmentId, contentTypes) {
  return Promise.map(contentTypes, (contentType) => {
    return client.editorInterface.get({ spaceId, environmentId, contentTypeId: contentType.sys.id })
      .then((editorInterface) => {
        logEmitter.emit('info', `Fetched editor interface for ${contentType.name}`)
        return editorInterface
      })
      .catch(() => {
        // old contentTypes may not have an editor interface but we'll handle in a later stage
        // but it should not stop getting the data process
        logEmitter.emit('warning', `No editor interface found for ${contentType.name || contentType.sys.id}`)
        return Promise.resolve(null)
      })
  }, {
    concurrency: 6
  })
}

/**
 * Gets all ExO entities using cursor-based pagination (pageNext/pagePrev tokens).
 * ExO list endpoints do not support skip-based pagination or the order param.
 */
async function cursorPagedGet(fetchFn, entityLabel) {
  const allItems = []
  let pageNext = null

  do {
    const query = { limit: pageLimit }
    if (pageNext) {
      query.pageNext = pageNext
    }
    const response = await fetchFn(query)
    allItems.push(...response.items)
    logEmitter.emit('info', `Fetched ${allItems.length} ${entityLabel} items`)
    pageNext = response.pages?.next ?? null
  } while (pageNext)

  return allItems
}

/**
 * Gets all roles. Roles are scheduled to switch from skip/limit to
 * cursor-based (pages.next/pagePrev) pagination on Feb 15, 2027:
 * https://www.contentful.com/developers/api-changes/space-roles-collection-endpoints-update/
 * Handles both shapes so this keeps working across that migration.
 */
async function pagedRolesGet({ client, spaceId }) {
  const allItems = []
  const order = 'sys.createdAt,sys.id'

  let response = await client.role.getMany({ spaceId, query: { limit: pageLimit, order } })
  allItems.push(...response.items)
  logEmitter.emit('info', `Fetched ${allItems.length} roles`)

  if (response.pages !== undefined) {
    let pageNext = response.pages?.next ?? null
    while (pageNext) {
      response = await client.role.getMany({ spaceId, query: { limit: pageLimit, order, pageNext } })
      allItems.push(...response.items)
      logEmitter.emit('info', `Fetched ${allItems.length} roles`)
      pageNext = response.pages?.next ?? null
    }
  } else {
    let skip = allItems.length
    while (allItems.length < response.total && response.items.length > 0) {
      response = await client.role.getMany({ spaceId, query: { limit: pageLimit, order, skip } })
      allItems.push(...response.items)
      logEmitter.emit('info', `Fetched ${allItems.length} roles`)
      skip += response.items.length
    }
  }

  return allItems
}

/**
 * Recursively fetches all pages of a offset-based paginated CMA collection and returns
 * them merged into a single response shaped like `{ items: [...], total, ... }`
 *
 * Gets all the existing entities based on pagination parameters.
 * The first call will have no aggregated response. Subsequent calls will
 * concatenate the new responses to the original one.
 */
function pagedGet(fetchFn, userQuery = null, skip = 0, aggregatedResponse = null) {
  const userQueryLimit = userQuery && userQuery.limit
  const fetchedTotal = aggregatedResponse && aggregatedResponse.items.length
  const limit = userQueryLimit ? Math.min(pageLimit, userQueryLimit - fetchedTotal) : pageLimit

  const query = {
    skip,
    order: 'sys.createdAt,sys.id',
    ...userQuery,
    limit
  }

  return fetchFn(query)
    .then((response) => {
      if (!aggregatedResponse) {
        aggregatedResponse = response
      } else {
        aggregatedResponse.items = aggregatedResponse.items.concat(response.items)
      }

      const totalItemsLength = aggregatedResponse.items.length
      const total = response.total

      logPagingStatus(response, query, userQueryLimit)

      const gotAllQueryLimitedItems = userQueryLimit && totalItemsLength >= userQueryLimit
      const gotAllItems = totalItemsLength >= total
      const gotNoItems = totalItemsLength <= 0
      if (gotAllQueryLimitedItems || gotAllItems || gotNoItems) {
        return aggregatedResponse
      }
      return pagedGet(fetchFn, userQuery, skip + response.items.length, aggregatedResponse)
    })
}

function logPagingStatus(response, requestQuery, userLimit) {
  const { total, limit, items } = response
  const pagedItemsLength = items.length

  // sometimes our pageLimit or queryLimit of 1000 is overridden by the API (like in locales)
  const imposedLimit = limit || requestQuery.limit
  const limitedTotal = userLimit ? Math.min(userLimit, total) : total
  const page = Math.ceil(requestQuery.skip / imposedLimit) + 1
  const pages = Math.ceil(limitedTotal / imposedLimit)
  logEmitter.emit('info', `Fetched ${pagedItemsLength} of ${total} items (Page ${page}/${pages})`)
}

function extractItems(response) {
  return response.items
}

function filterDrafts(items, includeDrafts, cdaClient) {
  // CDA filters drafts based on host, no need to do filtering here
  return (includeDrafts || cdaClient) ? items : items.filter((item) => !!item.sys.publishedVersion || !!item.sys.archivedVersion)
}

function filterArchived(items, includeArchived) {
  return includeArchived ? items : items.filter((item) => !item.sys.archivedVersion)
}

function removeTags(items, stripTags) {
  if (stripTags) {
    items.forEach(item => {
      if (item.metadata?.tags) {
        item.metadata.tags = []
      }
    })
  }
  return items
}
