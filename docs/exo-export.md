# Experience Orchestration (ExO) Export

## What is ExO?

Experience Orchestration (ExO) is Contentful's system for composing and rendering structured page experiences. It sits above the traditional entry/content-type layer and provides six dedicated entity types — Design Tokens, Components, Experience Templates, Data Assemblies, Experience Fragments, and Experiences — that together describe how content is fetched, assembled, and laid out.

## Enabling ExO export

Pass `includeExperienceOrchestration: true` to `runContentfulExport`:

```javascript
import contentfulExport from 'contentful-export'

const result = await contentfulExport({
  spaceId: '<space_id>',
  managementToken: '<management_token>',
  includeExperienceOrchestration: true,
})

// result will contain:
// result.designTokens       — array of Design Token entities
// result.components         — array of Component entities
// result.experienceTemplates — array of Experience Template entities
// result.dataAssemblies     — array of Data Assembly entities
// result.experienceFragments — array of Experience Fragment entities
// result.experiences        — array of Experience entities
```

## Entitlement requirement

ExO features must be enabled for a Contentful Organization. If an Organization does not have this entitlement, the CMA will reject ExO API calls. The export tool handles this gracefully:

- Each ExO entity type is fetched independently, wrapped in a `try/catch`.
- On failure, the entity array is set to `[]` and a warning is logged — the export continues and completes normally.
- No error is thrown and the export is not aborted.

This means you can safely pass `includeExperienceOrchestration: true` against any space. Non-entitled spaces produce empty arrays; entitled spaces produce the full entity lists.

## Output structure

The six ExO fields are appended to the standard export output:

```json
{
  "contentTypes": [],
  "entries": [],
  "assets": [],
  "locales": [],
  "tags": [],
  "webhooks": [],
  "roles": [],
  "editorInterfaces": [],
  "designTokens": [],
  "components": [],
  "experienceTemplates": [],
  "dataAssemblies": [],
  "experienceFragments": [],
  "experiences": []
}
```

## Using ExO export output with contentful-import

The six ExO arrays exported here are designed to be fed directly into `contentful-import` with `includeExperienceOrchestration: true`. Import handles ID preservation, dependency ordering (topological sort for Components and Fragments), and folder concept rewriting. See [contentful-import's ExO doc](https://github.com/contentful/contentful-import/blob/main/docs/exo-import.md) for import-side details.

## Optimization Variants

Experiences and Experience Fragments each support **Optimization Variants** — alternate versions of the same entity used for personalization. Unlike every other ExO entity type, a variant has no globally-unique `sys.id` of its own: the API's optimization-variants response reuses the **parent's** `sys.id`, and identifies the variant instead via `sys.variant` (a server-generated UUID), `sys.variantType`, and `sys.variantDimension`.

Because of that non-unique ID, variants are **not** exported as a seventh flat top-level array the way the other six ExO entity types are. Exporting them that way would silently collide entries under the same `sys.id` the moment more than one variant existed per parent. Instead, variants are nested directly onto their parent:

```json
{
  "experiences": [
    {
      "sys": { "id": "abc123", "type": "Experience", "variant": "default", "variantType": "default" },
      "name": "Homepage",
      "optimizationVariants": [
        {
          "sys": { "id": "abc123", "type": "Experience", "variant": "f3a1...", "variantType": "personalization" },
          "name": "Homepage (Variant A)"
        }
      ]
    }
  ],
  "experienceFragments": [
    {
      "sys": { "id": "def456", "type": "ExperienceFragment" },
      "name": "Hero Banner",
      "optimizationVariants": []
    }
  ]
}
```

This is additive: no existing helper that builds or reads the six top-level arrays needed to change, since variants live in a new nested field rather than a seventh flat array that would need the same `sys.id`-uniqueness assumption the other six rely on.

### Enabling variant export

Variant export is a separate opt-in on top of `includeExperienceOrchestration`, defaulting to `false`:

```javascript
const result = await contentfulExport({
  spaceId: '<space_id>',
  managementToken: '<management_token>',
  includeExperienceOrchestration: true,
  includeExoVariants: true,
})
```

- When `includeExoVariants` is **omitted or `false`**, `experience`/`experienceFragment` objects have no `optimizationVariants` field at all — not even an empty array. This keeps the default export output byte-identical to before this feature existed.
- When **`true`**, every Experience and Experience Fragment gets an `optimizationVariants` array, even if empty (a parent with no real variants exports `optimizationVariants: []`, not an absent field).
- The upstream API's `optimization_variants` list endpoint always leads with an entry representing the parent's own base view (`sys.variantType: 'default'`) — that's the same entity already exported as its own top-level Experience/ExperienceFragment, not a real variant, so it's filtered out here to avoid double-counting.
- Each type's count also appears as its own row in the CLI summary table (`Experience Optimization Variants` / `Experience Fragment Optimization Variants`) when the flag is enabled.

### Using variant export output with contentful-import

`contentful-import`'s ExO import handles the nested `optimizationVariants` array automatically when `includeExperienceOrchestration: true` is passed — no separate import-side flag is needed; import behavior is driven by whether the field is present in the source data. See [contentful-import's ExO doc](https://github.com/contentful/contentful-import/blob/main/docs/exo-import.md#optimization-variants) for import-side details, including why variant IDs are not preserved across import (the upstream API always server-generates a fresh ID on create).
