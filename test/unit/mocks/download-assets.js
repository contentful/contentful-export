export const mockDownloadAssets = async (ctx) => {
  ctx.assetDownloads = {
    successCount: 3,
    warningCount: 2,
    errorCount: 1
  }
}
