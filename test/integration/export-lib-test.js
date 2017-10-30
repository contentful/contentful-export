import test from 'tape'
import runContentfulExport from '../../dist/index'

const spaceId = process.env.EXPORT_SPACE_ID
const managementToken = process.env.MANAGEMENT_TOKEN

test('It should export space when used as a library', (t) => {
  t.plan(8)
  return runContentfulExport({spaceId, managementToken, saveFile: false})
    .then((content) => {
      t.ok(content)
      t.equal(content.contentTypes.length, 2, '2 content types should be exported')
      t.equal(content.editorInterfaces.length, 2, '2 editor interfaces should be exported')
      t.equal(content.entries.length, 4, '4 entries should be exported')
      t.equal(content.assets.length, 4, '4 assets should be exported')
      t.equal(content.locales.length, 1, '1 locale should be exported')
      t.equal(content.webhooks.length, 0, '0 webhooks should be exported')
      t.equal(content.roles.length, 7, '7 roles should be exported')
    })
})
