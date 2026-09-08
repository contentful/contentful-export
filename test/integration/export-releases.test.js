import { join } from 'path'

import mkdirp from 'mkdirp'
import rimraf from 'rimraf'
import { createClient } from 'contentful-management'

import runContentfulExport from '../../dist/index'

jest.setTimeout(180000)

const tmpFolder = join(__dirname, 'tmp-releases')
const managementToken = process.env.MANAGEMENT_TOKEN
const organizationId = process.env.EXPORT_ORGANIZATION_ID

const ENVIRONMENT_ID = 'master'
const CONTENT_TYPE_ID = 'testPage'

const rootClient = createClient({ accessToken: managementToken })

let spaceId
let client
let entryId
let releaseId

beforeAll(async () => {
  mkdirp.sync(tmpFolder)

  const space = await rootClient.space.create({ organizationId }, { name: 'contentful-export-releases-test' })
  spaceId = space.sys.id
  client = createClient({ accessToken: managementToken }, { defaults: { spaceId, environmentId: ENVIRONMENT_ID } })

  const contentType = await client.contentType.createWithId(
    { contentTypeId: CONTENT_TYPE_ID },
    {
      name: 'Test Page',
      displayField: 'title',
      fields: [
        { id: 'title', name: 'Title', type: 'Symbol', required: false, localized: false }
      ]
    }
  )
  const publishedContentType = await client.contentType.publish({ contentTypeId: contentType.sys.id }, contentType)

  const entry = await client.entry.create(
    { contentTypeId: publishedContentType.sys.id },
    { fields: { title: { 'en-US': 'Test Page' } } }
  )
  const publishedEntry = await client.entry.publish({ entryId: entry.sys.id }, entry)
  entryId = publishedEntry.sys.id

  const release = await client.release.create(
    {},
    {
      sys: { type: 'Release', schemaVersion: 'Release.v2' },
      title: 'Test Release for export',
      entities: {
        sys: { type: 'Array' },
        items: [
          { entity: { sys: { type: 'Link', linkType: 'Entry', id: entryId } }, action: 'publish' }
        ]
      }
    }
  )
  releaseId = release.sys.id
})

afterAll(async () => {
  await client.release.delete({ releaseId })
  await rootClient.space.delete({ spaceId })
  rimraf.sync(tmpFolder)
})

describe('Releases', () => {
  it('does not export releases when skipReleases is set', () => {
    return runContentfulExport({
      spaceId,
      managementToken,
      saveFile: false,
      exportDir: tmpFolder,
      skipReleases: true
    }).then((content) => {
      expect(content.releases).toBeUndefined()
    })
  })

  it('exports the release with its title, schemaVersion, and entities collection', () => {
    return runContentfulExport({
      spaceId,
      managementToken,
      saveFile: false,
      exportDir: tmpFolder
    }).then((content) => {
      expect(Array.isArray(content.releases)).toBe(true)
      const exported = content.releases.find((r) => r.sys.id === releaseId)
      expect(exported).toBeDefined()
      expect(exported.title).toBe('Test Release for export')
      expect(exported.sys.schemaVersion).toBe('Release.v2')
      expect(exported.entities.items).toHaveLength(1)
      expect(exported.entities.items[0].entity.sys.id).toBe(entryId)
      expect(exported.entities.items[0].entity.sys.linkType).toBe('Entry')
      expect(exported.entities.items[0].action).toBe('publish')
    })
  })
})
