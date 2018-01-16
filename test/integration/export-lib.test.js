import runContentfulExport from '../../dist/index'

jest.setTimeout(10000)

const spaceId = process.env.EXPORT_SPACE_ID
const managementToken = process.env.MANAGEMENT_TOKEN

test('It should export space when used as a library', () => {
  return runContentfulExport({spaceId, managementToken, saveFile: false})
    .catch((multierror) => {
      const errors = multierror.errors.filter((error) => error.hasOwnProperty('error'))
      expect(errors).toHaveLength(0)
    })
    .then((content) => {
      expect(content).toBeTruthy()
      expect(content.contentTypes).toHaveLength(2)
      expect(content.editorInterfaces).toHaveLength(2)
      expect(content.entries).toHaveLength(4)
      expect(content.assets).toHaveLength(4)
      expect(content.locales).toHaveLength(1)
      expect(content.webhooks).toHaveLength(0)
      expect(content.roles).toHaveLength(7)
    })
})
