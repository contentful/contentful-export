import path from 'path'

export function buildLocalFilePath (url, directory, fileName) {
  const { host, pathname } = new URL(url)
  // Extract directory path without leading slash
  const pathWithoutFilename = pathname.substring(1, pathname.lastIndexOf('/') + 1)
  const localFilePath = path.join(directory, host, pathWithoutFilename, fileName)

  return localFilePath
}
