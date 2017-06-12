import test from 'tape'
import nixt from 'nixt'
import { join } from 'path'
import fs from 'fs'
import rimraf from 'rimraf'
const bin = join(__dirname, '../../', 'bin')
const tmpFolder = join(__dirname, 'tmp')
const app = () => {
  return nixt({ newlines: true }).cwd(bin).base('./contentful-export').clone()
}

const spaceId = process.env.EXPORT_SPACE_ID
const managementToken = process.env.MANAGEMENT_TOKEN
let filePath = null

test('It should export space properly when running as a cli', (t) => {
  t.plan(7)
  fs.mkdirSync(tmpFolder)
  app()
    .run(` --space-id ${spaceId} --management-token ${managementToken} --export-dir ${tmpFolder}`)
    .stdout(/Exported entities/)
    .stdout(/Content Types {13}| 3/)
    .stdout(/Editor Interfaces {9}| 3/)
    .stdout(/Entries {19}| 6/)
    .stdout(/Assets {20}| 6/)
    .stdout(/Locales {19}| 1/)
    .stdout(/Webhooks {18}| 0/)
    .stdout(/Roles {21}| 7/)
    .end(() => {
      const fileList = fs.readdirSync(tmpFolder)
      filePath = fileList[0] // we only have one file
      const exportedFile = JSON.parse(fs.readFileSync(join(tmpFolder, filePath)))
      t.equal(exportedFile.contentTypes.length, 3, '3 content types should be exported')
      t.equal(exportedFile.editorInterfaces.length, 3, '3 editor interfaces should be exported')
      t.equal(exportedFile.entries.length, 6, '6 entries should be exported')
      t.equal(exportedFile.assets.length, 6, '6 assets should be exported')
      t.equal(exportedFile.locales.length, 1, '1 locale should be exported')
      t.equal(exportedFile.webhooks.length, 0, '0 webhooks should be exported')
      t.equal(exportedFile.roles.length, 7, '7 roles should be exported')
      rimraf(tmpFolder, () => {
        t.end()
      })
    })
})
