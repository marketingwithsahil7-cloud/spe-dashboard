export async function sharePdfFile(
  pdfBlob: Blob,
  fileName: string,
  shareTitle: string,
  shareText: string,
): Promise<{ success: boolean; method: string }> {
  const file = new File([pdfBlob], fileName, { type: 'application/pdf' })

  // Web Share API with file sharing — only available in modern mobile browsers.
  // Runtime guard: navigator.canShare may be undefined on older/desktop browsers.
  const canShareFiles =
    navigator.canShare && navigator.canShare({ files: [file] })

  if (canShareFiles) {
    try {
      await navigator.share({ files: [file], title: shareTitle, text: shareText })
      return { success: true, method: 'native_share' }
    } catch (err) {
      // AbortError = user cancelled share sheet — not a failure
      if ((err as Error).name === 'AbortError') {
        return { success: false, method: 'cancelled' }
      }
      throw err
    }
  }

  // Fallback for desktop/unsupported browsers: trigger PDF download
  const url = URL.createObjectURL(pdfBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return { success: true, method: 'download' }
}
