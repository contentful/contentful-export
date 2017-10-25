import { join } from 'path'
import fs from 'fs'

import test from 'blue-tape'
import mkdirp from 'mkdirp'
import nixt from 'nixt'
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
  mkdirp.sync(tmpFolder)
  app()
    .run(` --space-id ${spaceId} --management-token ${managementToken} --export-dir ${tmpFolder}`)
    .stdout(/Exported entities/)
    .stdout(/Content Types +| 2/)
    .stdout(/Editor Interfaces +| 2/)
    .stdout(/Entries +| 4/)
    .stdout(/Assets +| 4/)
    .stdout(/Locales +| 1/)
    .stdout(/Webhooks +| 0/)
    .stdout(/Roles +| 7/)
    .end((error) => {
      if (error) {
        console.error(error)
        t.fail('Should not throw error')
      }
      const fileList = fs.readdirSync(tmpFolder)
      if (!fileList.length) {
        t.fail('No file was exported. Did you set EXPORT_SPACE_ID and MANAGEMENT_TOKEN env variables?')
        return t.end()
      }
      filePath = fileList[0] // we only have one file
      const exportedFile = JSON.parse(fs.readFileSync(join(tmpFolder, filePath)))
      t.equal(exportedFile.contentTypes.length, 2, '2 content types should be exported')
      t.equal(exportedFile.editorInterfaces.length, 2, '2 editor interfaces should be exported')
      t.equal(exportedFile.entries.length, 4, '4 entries should be exported')
      t.equal(exportedFile.assets.length, 4, '4 assets should be exported')
      t.equal(exportedFile.locales.length, 1, '1 locale should be exported')
      t.equal(exportedFile.webhooks.length, 0, '0 webhooks should be exported')
      t.equal(exportedFile.roles.length, 7, '7 roles should be exported')
      rimraf(tmpFolder, () => {
        t.end()
      })
    })
})
