#!/usr/bin/env node
/**
 * Manual scenario runner for PR #2341 (cma-plain-client).
 * Exercises get-space-data.js against a real space with the plain CMA client
 * and, where applicable, the CDA client -- to sanity-check the refactor beyond
 * unit tests. Requires `npm run build` to have been run first (uses dist/).
 *
 * Usage:
 *   EXPORT_SPACE_ID=... MANAGEMENT_TOKEN=... DELIVERY_TOKEN=... \
 *     node scripts/manual-scenarios.mjs [scenario-name]
 *
 * With no scenario name, runs all scenarios sequentially.
 */

import runContentfulExport from '../dist/index.js'

const spaceId = process.env.EXPORT_SPACE_ID
const managementToken = process.env.MANAGEMENT_TOKEN
const deliveryToken = process.env.DELIVERY_TOKEN
const environmentId = process.env.EXPORT_ENVIRONMENT_ID // optional, defaults to master

if (!spaceId || !managementToken) {
  console.error('EXPORT_SPACE_ID and MANAGEMENT_TOKEN are required env vars.')
  process.exit(1)
}

// Small page size forces pagedGet/cursorPagedGet/pagedRolesGet to make multiple
// requests even against a small test space, exercising the pagination paths.
const maxAllowedLimit = process.env.MAX_ALLOWED_LIMIT ? Number(process.env.MAX_ALLOWED_LIMIT) : 5

const base = { spaceId, managementToken, saveFile: false, maxAllowedLimit }
if (environmentId) base.environmentId = environmentId

const scenarios = {
  'cma-only': {
    ...base,
    description: 'Pure CMA client, drafts excluded (default) -- exercises client.entry/asset.getMany directly.'
  },
  'cma-with-drafts': {
    ...base,
    includeDrafts: true,
    description: 'CMA client, includeDrafts:true -- even with deliveryToken set this should stay on CMA per lib/index.js:63.',
    ...(deliveryToken ? { deliveryToken } : {})
  },
  'cda-published-only': deliveryToken
    ? {
        ...base,
        deliveryToken,
        description: 'CMA for content-model/roles/webhooks, CDA for entries/assets (published-only, no includeDrafts) -- exercises cdaClient.withAllLocales.getEntries/getAssets.'
      }
    : null,
  'cda-with-archived': deliveryToken
    ? {
        ...base,
        deliveryToken,
        includeArchived: true,
        description: 'CDA path + includeArchived:true -- confirms filterArchived still behaves with CDA-shaped items.'
      }
    : null,
  'skip-everything-toggleable': {
    ...base,
    skipContentModel: true,
    skipEditorInterfaces: true,
    skipAssets: true,
    skipWebhooks: true,
    skipRoles: true,
    skipTags: true,
    description: 'All skip* flags on -- confirms Listr skip predicates still short-circuit correctly post-refactor.'
  },
  'exo-orchestration': {
    ...base,
    includeExperienceOrchestration: true,
    description: 'ExO entities on -- exercises cursorPagedGet against component/designToken/experienceTemplate/dataAssembly/experienceFragment/experience.'
  },
  'roles-pagination-stress': {
    ...base,
    skipContent: true,
    skipContentModel: true,
    skipWebhooks: true,
    includeExperienceOrchestration: false,
    description: 'Isolates roles fetch (pagedRolesGet) -- run against a space with >25 custom roles to confirm no duplication/drop.'
  }
}

function summarize (data) {
  const summary = {}
  for (const [key, value] of Object.entries(data)) {
    summary[key] = Array.isArray(value) ? value.length : typeof value
  }
  return summary
}

async function runScenario (name, options) {
  console.log(`\n${'='.repeat(70)}\nScenario: ${name}\n${options.description}\n${'='.repeat(70)}`)
  const { description, ...runOptions } = options
  try {
    const data = await runContentfulExport(runOptions)
    console.log('Result:', JSON.stringify(summarize(data), null, 2))
    if (data.roles) {
      const ids = data.roles.map((r) => r.sys.id)
      const uniqueIds = new Set(ids)
      if (ids.length !== uniqueIds.size) {
        console.error(`DUPLICATE ROLES DETECTED: ${ids.length} items, ${uniqueIds.size} unique ids`)
      } else {
        console.log(`Roles OK: ${ids.length} unique roles`)
      }
    }
  } catch (err) {
    console.error('FAILED:', err.message || err)
    if (err.errors) {
      console.error(JSON.stringify(err.errors, null, 2))
    }
  }
}

async function main () {
  const requested = process.argv[2]
  const toRun = requested
    ? { [requested]: scenarios[requested] }
    : scenarios

  for (const [name, options] of Object.entries(toRun)) {
    if (!options) {
      console.log(`\nSkipping "${name}" -- requires DELIVERY_TOKEN, which was not set.`)
      continue
    }
    await runScenario(name, options)
  }
}

main()
