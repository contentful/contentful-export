import { join } from 'path'

import mkdirp from 'mkdirp'
import rimraf from 'rimraf'
import { createClient } from 'contentful-management'

import runContentfulExport from '../../dist/index'

jest.setTimeout(180000)

const tmpFolder = join(__dirname, 'tmp-exo')
const managementToken = process.env.MANAGEMENT_TOKEN
const organizationId = process.env.EXPORT_ORGANIZATION_ID

const ENVIRONMENT_ID = 'master'
const CONTENT_TYPE_ID = 'testPage'

const EXO_URN_BASE = 'crn:contentful:::experience:spaces/$self/environments/$self'
const CONTENT_URN_BASE = 'crn:contentful:::content:spaces/$self/environments/$self'

const resourceLink = (linkType, urn) => ({ sys: { type: 'ResourceLink', linkType, urn } })
const componentUrn = (id) => `${EXO_URN_BASE}/components/${id}`
const fragmentUrn = (id) => `${EXO_URN_BASE}/experienceFragments/${id}`
const dataAssemblyUrn = (id) => `${EXO_URN_BASE}/dataAssemblies/${id}`
const entryUrn = (id) => `${CONTENT_URN_BASE}/entries/${id}`

const VIEWPORT = { id: '_', query: '*', displayName: 'Default', previewSize: '1024px' }

async function retry(fn, attempts = 5, delayMs = 2000) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  throw lastErr
}

const rootClient = createClient({ accessToken: managementToken })

let spaceId
let client
let entryId
const createdIds = {
  designTokens: [],
  components: [],
  experienceTemplates: [],
  dataAssemblies: [],
  experienceFragments: [],
  experiences: []
}

beforeAll(async () => {
  mkdirp.sync(tmpFolder)

  const space = await rootClient.space.create({ organizationId }, { name: 'contentful-export-exo-test' })
  spaceId = space.sys.id
  client = createClient({ accessToken: managementToken }, { defaults: { spaceId, environmentId: ENVIRONMENT_ID } })

  // Content layer: a minimal content type + entry, used as the target of DataAssembly/
  // contentBindings parameters, mirroring how real ExO spaces reference real content.
  const contentType = await retry(() =>
    client.contentType.createWithId(
      { contentTypeId: CONTENT_TYPE_ID },
      {
        name: 'Test Page',
        displayField: 'title',
        fields: [
          { id: 'title', name: 'Title', type: 'Symbol', required: false, localized: false },
          { id: 'message', name: 'Message', type: 'Symbol', required: true, localized: false }
        ]
      }
    )
  )
  const publishedContentType = await client.contentType.publish({ contentTypeId: contentType.sys.id }, contentType)

  const entry = await client.entry.create(
    { contentTypeId: publishedContentType.sys.id },
    { fields: { title: { 'en-US': 'Test Page' }, message: { 'en-US': 'Page not found' } } }
  )
  const publishedEntry = await client.entry.publish({ entryId: entry.sys.id }, entry)
  entryId = publishedEntry.sys.id

  // Design Tokens (2) -- upserted, auto-published server-side.
  const colorToken = await client.designToken.upsert(
    { designTokenId: 'colorToken' },
    { sys: { id: 'colorToken', type: 'DesignToken' }, name: 'Test Color Token', type: 'DTCG.Color' }
  )
  const secondColorToken = await client.designToken.upsert(
    { designTokenId: 'secondColorToken' },
    { sys: { id: 'secondColorToken', type: 'DesignToken' }, name: 'Test Secondary Color Token', type: 'DTCG.Color' }
  )
  createdIds.designTokens.push(colorToken.sys.id, secondColorToken.sys.id)

  // Data Assemblies (2) -- each binds a parameter to an Entry of the content type above.
  const assemblyA = await client.dataAssembly.create(
    {},
    {
      sys: { type: 'DataAssembly', dataType: [{ id: 'message', name: 'Message', type: 'String', required: true }] },
      metadata: { tags: [] },
      name: 'Assembly A',
      description: 'Test data assembly A',
      parameters: {
        p_entry: {
          name: 'Entry',
          type: 'ResourceLink',
          linkType: 'Contentful:Entry',
          allowedResources: [
            { type: 'Contentful:Entry', source: 'crn:contentful:::content:spaces/$self/environments/$self', allowedTypes: [CONTENT_TYPE_ID] }
          ]
        }
      },
      resolvers: {
        r_node: {
          source: 'Contentful:GraphQL',
          query: 'query ($id: ID!) { _node(id: $id) { __typename ... on TestPage { message } } }',
          parameters: { id: '$parameters/p_entry' }
        }
      },
      return: { message: { $from: { source: '$resolvers/r_node/_node', select: { $on: { type: { TestPage: 'message' } } } } } }
    }
  )
  const publishedAssemblyA = await client.dataAssembly.publish({ dataAssemblyId: assemblyA.sys.id, version: assemblyA.sys.version })

  const assemblyB = await client.dataAssembly.create(
    {},
    {
      sys: { type: 'DataAssembly', dataType: [{ id: 'message', name: 'Message', type: 'String', required: true }] },
      metadata: { tags: [] },
      name: 'Assembly B',
      description: 'Test data assembly B',
      parameters: {
        p_entry: {
          name: 'Entry',
          type: 'ResourceLink',
          linkType: 'Contentful:Entry',
          allowedResources: [
            { type: 'Contentful:Entry', source: 'crn:contentful:::content:spaces/$self/environments/$self', allowedTypes: [CONTENT_TYPE_ID] }
          ]
        }
      },
      resolvers: {
        r_node: {
          source: 'Contentful:GraphQL',
          query: 'query ($id: ID!) { _node(id: $id) { __typename ... on TestPage { message } } }',
          parameters: { id: '$parameters/p_entry' }
        }
      },
      return: { message: { $from: { source: '$resolvers/r_node/_node', select: { $on: { type: { TestPage: 'message' } } } } } }
    }
  )
  const publishedAssemblyB = await client.dataAssembly.publish({ dataAssemblyId: assemblyB.sys.id, version: assemblyB.sys.version })
  createdIds.dataAssemblies.push(publishedAssemblyA.sys.id, publishedAssemblyB.sys.id)

  // Components (3) -- baseComponent (Slot placeholder) -> fragmentA -> compositeComponent
  // (Component + ExperienceFragment tree nodes, DataAssembly link, DesignToken-backed design property).
  const baseComponent = await client.component.create(
    {},
    {
      name: 'Base Component',
      description: 'Leaf component exercising a Slot placeholder',
      viewports: [VIEWPORT],
      contentProperties: [],
      designProperties: [],
      slots: [{ id: 'untitledSlot1', name: 'Untitled slot 1', required: false, validations: [] }],
      componentTree: [{ id: 'slotNode1', nodeType: 'Slot', slotId: 'untitledSlot1' }],
      metadata: { tags: [], concepts: [] }
    }
  )
  const publishedBaseComponent = await client.component.publish({ componentId: baseComponent.sys.id, version: baseComponent.sys.version })

  const leafComponent = await client.component.create(
    {},
    {
      name: 'Leaf Component',
      description: 'Component exercising a DesignToken-backed design property and a DataAssembly link',
      viewports: [VIEWPORT],
      contentProperties: [],
      designProperties: [
        {
          id: 'dp_color',
          name: 'Color',
          type: 'DTCG.Color',
          fallbackValue: { type: 'DesignToken', value: colorToken.sys.id },
          allowedResources: [{ type: 'DesignToken', value: colorToken.sys.id }]
        }
      ],
      dataAssemblies: [resourceLink('Contentful:DataAssembly', dataAssemblyUrn(publishedAssemblyA.sys.id))],
      metadata: { tags: [], concepts: [] }
    }
  )
  const publishedLeafComponent = await client.component.publish({ componentId: leafComponent.sys.id, version: leafComponent.sys.version })

  const fragmentA = await client.experienceFragment.create(
    {},
    {
      name: 'Fragment A',
      description: 'Fragment wrapping the base component',
      viewports: [VIEWPORT],
      designProperties: {},
      component: resourceLink('Contentful:Component', componentUrn(publishedBaseComponent.sys.id))
    }
  )
  const publishedFragmentA = await client.experienceFragment.publish({ experienceFragmentId: fragmentA.sys.id, version: fragmentA.sys.version })

  const compositeComponent = await client.component.create(
    {},
    {
      name: 'Composite Component',
      description: 'Component exercising Component -> Component and Component -> ExperienceFragment tree nodes',
      viewports: [VIEWPORT],
      contentProperties: [],
      designProperties: [],
      dataAssemblies: [resourceLink('Contentful:DataAssembly', dataAssemblyUrn(publishedAssemblyB.sys.id))],
      componentTree: [
        {
          id: 'compNode1',
          nodeType: 'Component',
          component: resourceLink('Contentful:Component', componentUrn(publishedLeafComponent.sys.id)),
          contentProperties: {},
          designProperties: {},
          slots: {}
        },
        {
          id: 'fragNode1',
          nodeType: 'ExperienceFragment',
          experienceFragment: resourceLink('Contentful:ExperienceFragment', fragmentUrn(publishedFragmentA.sys.id))
        }
      ],
      metadata: { tags: [], concepts: [] }
    }
  )
  const publishedCompositeComponent = await client.component.publish({ componentId: compositeComponent.sys.id, version: compositeComponent.sys.version })
  createdIds.components.push(publishedBaseComponent.sys.id, publishedLeafComponent.sys.id, publishedCompositeComponent.sys.id)

  // Experience Fragments (2) -- fragmentA (above) and fragmentB, which wraps the composite
  // component and binds contentBindings to a DataAssembly + a real Entry.
  const fragmentB = await client.experienceFragment.create(
    {},
    {
      name: 'Fragment B',
      description: 'Fragment wrapping the composite component with contentBindings',
      viewports: [VIEWPORT],
      designProperties: {},
      component: resourceLink('Contentful:Component', componentUrn(publishedCompositeComponent.sys.id)),
      contentBindings: {
        sys: resourceLink('Contentful:DataAssembly', dataAssemblyUrn(publishedAssemblyB.sys.id)).sys,
        parameters: { p_entry: resourceLink('Contentful:Entry', entryUrn(publishedEntry.sys.id)) }
      }
    }
  )
  const publishedFragmentB = await client.experienceFragment.publish({ experienceFragmentId: fragmentB.sys.id, version: fragmentB.sys.version })
  createdIds.experienceFragments.push(publishedFragmentA.sys.id, publishedFragmentB.sys.id)

  // Experience Templates (2) -- templateA wraps fragmentA; templateB exercises a Component
  // tree node + an ExperienceFragment tree node together, plus a DataAssembly link.
  const templateA = await client.experienceTemplate.create(
    {},
    {
      name: 'Template A',
      description: 'Template wrapping fragment A',
      viewports: [VIEWPORT],
      contentProperties: [],
      designProperties: [],
      dataAssemblies: [resourceLink('Contentful:DataAssembly', dataAssemblyUrn(publishedAssemblyA.sys.id))],
      componentTree: [
        {
          id: 'tplFragNode1',
          nodeType: 'ExperienceFragment',
          experienceFragment: resourceLink('Contentful:ExperienceFragment', fragmentUrn(publishedFragmentA.sys.id))
        }
      ],
      metadata: { tags: [], concepts: [] }
    }
  )
  const publishedTemplateA = await client.experienceTemplate.publish({ experienceTemplateId: templateA.sys.id, version: templateA.sys.version })

  const templateB = await client.experienceTemplate.create(
    {},
    {
      name: 'Template B',
      description: 'Template wrapping the composite component and fragment B',
      viewports: [VIEWPORT],
      contentProperties: [],
      designProperties: [],
      dataAssemblies: [resourceLink('Contentful:DataAssembly', dataAssemblyUrn(publishedAssemblyB.sys.id))],
      componentTree: [
        {
          id: 'tplCompNode1',
          nodeType: 'Component',
          component: resourceLink('Contentful:Component', componentUrn(publishedCompositeComponent.sys.id)),
          contentProperties: {},
          designProperties: {},
          slots: {}
        },
        {
          id: 'tplFragNode2',
          nodeType: 'ExperienceFragment',
          experienceFragment: resourceLink('Contentful:ExperienceFragment', fragmentUrn(publishedFragmentB.sys.id))
        }
      ],
      metadata: { tags: [], concepts: [] }
    }
  )
  const publishedTemplateB = await client.experienceTemplate.publish({ experienceTemplateId: templateB.sys.id, version: templateB.sys.version })
  createdIds.experienceTemplates.push(publishedTemplateA.sys.id, publishedTemplateB.sys.id)

  // Experiences (2) -- one per template.
  const experienceA = await client.experience.create(
    {},
    {
      name: 'Experience A',
      description: 'Experience built from template A',
      viewports: [VIEWPORT],
      designProperties: {},
      experienceTemplate: resourceLink('Contentful:ExperienceTemplate', `${EXO_URN_BASE}/experienceTemplates/${publishedTemplateA.sys.id}`)
    }
  )
  const publishedExperienceA = await client.experience.publish({ experienceId: experienceA.sys.id, version: experienceA.sys.version })

  const experienceB = await client.experience.create(
    {},
    {
      name: 'Experience B',
      description: 'Experience built from template B',
      viewports: [VIEWPORT],
      designProperties: {},
      experienceTemplate: resourceLink('Contentful:ExperienceTemplate', `${EXO_URN_BASE}/experienceTemplates/${publishedTemplateB.sys.id}`)
    }
  )
  const publishedExperienceB = await client.experience.publish({ experienceId: experienceB.sys.id, version: experienceB.sys.version })
  createdIds.experiences.push(publishedExperienceA.sys.id, publishedExperienceB.sys.id)
})

afterAll(async () => {
  await rootClient.space.delete({ spaceId })
  rimraf.sync(tmpFolder)
})

describe('Experience Orchestration', () => {
  it('exports all 6 ExO arrays with exactly the entities and relationships that were seeded', () => {
    return runContentfulExport({
      spaceId,
      managementToken,
      saveFile: false,
      exportDir: tmpFolder,
      includeExperienceOrchestration: true
    }).then((content) => {
      Object.keys(createdIds).forEach((field) => {
        expect(Array.isArray(content[field])).toBe(true)
        expect(content[field]).toHaveLength(createdIds[field].length)
        const exportedIds = content[field].map((item) => item.sys.id)
        expect(new Set(exportedIds)).toEqual(new Set(createdIds[field]))
      })

      const exportedCompositeComponent = content.components.find((c) => c.name === 'Composite Component')
      const treeNodeTypes = exportedCompositeComponent.componentTree.map((node) => node.nodeType)
      expect(treeNodeTypes).toEqual(expect.arrayContaining(['Component', 'ExperienceFragment']))

      const exportedFragmentB = content.experienceFragments.find((f) => f.name === 'Fragment B')
      expect(exportedFragmentB.contentBindings.sys.urn).toBe(dataAssemblyUrn(createdIds.dataAssemblies[1]))
      expect(exportedFragmentB.contentBindings.parameters.p_entry.sys.urn).toBe(entryUrn(entryId))
    })
  })
})
