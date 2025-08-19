import path from 'path'
import { buildLocalFilePath } from '../../../lib/utils/buildLocalFilePath'

describe('buildLocalFilePath', () => {
  const baseDirectory = '/export'

  test('builds correct path for standard URL', () => {
    const url = 'https://images.ctfassets.net/space123/asset456/hash789/image.jpg'
    const fileName = 'image.jpg'

    const result = buildLocalFilePath(url, baseDirectory, fileName)

    expect(result).toBe(path.join(baseDirectory, 'images.ctfassets.net', 'space123/asset456/hash789/', fileName))
  })

  test('builds correct path for URL with Unicode filename', () => {
    const url = 'https://images.ctfassets.net/space123/asset456/hash789/测试文件.jpg'
    const fileName = '测试文件.jpg'

    const result = buildLocalFilePath(url, baseDirectory, fileName)

    expect(result).toBe(path.join(baseDirectory, 'images.ctfassets.net', 'space123/asset456/hash789/', fileName))
  })

  test('handles long Unicode filename', () => {
    const url = 'https://images.ctfassets.net/space123/asset456/hash789/encoded.jpg'
    const fileName = '测试文件'.repeat(25) + '.jpg'

    const result = buildLocalFilePath(url, baseDirectory, fileName)

    expect(result).toBe(path.join(baseDirectory, 'images.ctfassets.net', 'space123/asset456/hash789/', fileName))
  })

  test('handles different filename than URL path', () => {
    const url = 'https://images.ctfassets.net/space123/asset456/hash789/encoded_filename.jpg'
    const fileName = 'actual filename with spaces.jpg'

    const result = buildLocalFilePath(url, baseDirectory, fileName)

    expect(result).toBe(path.join(baseDirectory, 'images.ctfassets.net', 'space123/asset456/hash789/', fileName))
  })

  test('handles nested base directory', () => {
    const url = 'https://images.ctfassets.net/space123/asset456/hash789/image.jpg'
    const fileName = 'image.jpg'
    const customDirectory = '/custom/export/path'

    const result = buildLocalFilePath(url, customDirectory, fileName)

    expect(result).toBe(path.join(customDirectory, 'images.ctfassets.net', 'space123/asset456/hash789/', fileName))
  })

  test('fallback to URL pathname when fileName is undefined', () => {
    const url = 'https://images.ctfassets.net/space123/asset456/hash789/encoded_filename.jpg'

    const result = buildLocalFilePath(url, baseDirectory, undefined)

    expect(result).toBe(path.join(baseDirectory, 'images.ctfassets.net', '/space123/asset456/hash789/encoded_filename.jpg'))
  })

  test('fallback handles Unicode filename in URL', () => {
    const url = 'https://images.ctfassets.net/space123/asset456/hash789/测试文件.jpg'

    const result = buildLocalFilePath(url, baseDirectory, null)

    expect(result).toBe(path.join(baseDirectory, 'images.ctfassets.net', '/space123/asset456/hash789/测试文件.jpg'))
  })
})
