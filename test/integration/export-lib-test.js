import test from 'blue-tape'

import runContentfulExport from '../../dist/index'

const spaceId = process.env.EXPORT_SPACE_ID
const managementToken = process.env.MANAGEMENT_TOKEN

test('It should export space when used as a library', (t) => {
  t.plan(9)
  return runContentfulExport({spaceId, managementToken, saveFile: false})
    .catch((multierror) => {
      const errors = multierror.errors.filter((error) => error.hasOwnProperty('error'))
      t.equals(errors.length, 0, 'should not log any real errors, only warnings')
    })
    .then((content) => {
      t.ok(content)
      t.equal(content.contentTypes.length, 3, '3 content types should be exported')
      t.equal(content.editorInterfaces.length, 3, '3 editor interfaces should be exported')
      t.equal(content.entries.length, 6, '6 entries should be exported')
      t.equal(content.assets.length, 6, '6 assets should be exported')
      t.equal(content.locales.length, 1, '1 locale should be exported')
      t.equal(content.webhooks.length, 0, '0 webhooks should be exported')
      t.equal(content.roles.length, 7, '7 roles should be exported')
      t.pass('Finished export as a lib')
    })
})
