import Listr from 'listr'

export const mockGetSpaceData = () => {
  return new Listr([
    {
      title: 'mocked get full source space',
      task: (ctx) => {
        ctx.data = {
          contentTypes: [],
          entries: [],
          assets: [
            {
              sys: { id: 'someValidAsset' },
              fields: {
                file: {
                  'en-US': {
                    url: '//images.contentful.com/kq9lln4hyr8s/2MTd2wBirYikEYkIIc0YSw/7aa4c06f3054996e45bb3f13964cb254/rocka-nutrition.png'
                  }
                }
              }
            },
            {
              sys: { id: 'someBrokenAsset' },
              fields: {}
            }
          ],
          locales: []
        }
      }
    }
  ])
}
