import test from 'tape'
import nixt from 'nixt'
import { join } from 'path'
import fs from 'fs'
const bin = join(__dirname, '../../', 'bin')

const app = () => {
  return nixt({ newlines: true }).cwd(bin).base('./contentful-export').clone()
}

const spaceId = process.env.EXPORT_SPACE_ID
const managementToken = process.env.MANAGEMENT_TOKEN
let filePath = null

test.onFinish(() => {
  fs.unlinkSync(join(bin, filePath))
})

test('it should export space properly', (t) => {
  t.plan(7)
  app()
    .run(` --space-id ${spaceId} --management-token ${managementToken}`)
    .stdout(/Exported entities/)
    .stdout(/Content Types/)
    .stdout(/Editor Interfaces/)
    .stdout(/Entries/)
    .stdout(/Assets/)
    .stdout(/Locales/)
    .stdout(/Webhooks/)
    .stdout(/Roles/)
    .end(() => {
      const fileList = fs.readdirSync(bin)
      const exportedFileIndex = fileList.findIndex((element) => {
        return element.indexOf(`contentful-export-${spaceId}`) >= 0
      })
      filePath = fileList[exportedFileIndex]
      const exportedFile = JSON.parse(fs.readFileSync(join(bin, filePath)))
      t.equal(exportedFile.contentTypes.length, 3, '3 content types should be exported')
      t.equal(exportedFile.editorInterfaces.length, 3, '3 editor interfaces should be exported')
      t.equal(exportedFile.entries.length, 6, '6 entries should be exported')
      t.equal(exportedFile.assets.length, 6, '6 assets should be exported')
      t.equal(exportedFile.locales.length, 1, '1 locale should be exported')
      t.equal(exportedFile.webhooks.length, 0, '0 webhooks should be exported')
      t.equal(exportedFile.roles.length, 7, '7 roles should be exported')
      t.end()
    })
})
