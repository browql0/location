export function safeDownloadFileName(fileName: string, fallback = "download") {
  const cleaned = fileName
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/[\r\n"\\]+/g, "")
    .trim()
    .slice(0, 120);

  return cleaned || fallback;
}

export function attachmentDisposition(fileName: string, fallback?: string) {
  return `attachment; filename="${safeDownloadFileName(fileName, fallback)}"`;
}

export function inlineDisposition(fileName: string, fallback?: string) {
  return `inline; filename="${safeDownloadFileName(fileName, fallback)}"`;
}
