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
