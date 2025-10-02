const INVALID_FILENAME_CHARACTERS = /[\\/:*?"<>|]/g;

export function sanitiseFileName(rawName: string, fallback = 'ledger-download.bin'): string {
  const trimmed = rawName?.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(INVALID_FILENAME_CHARACTERS, '-');
}

export function triggerBrowserDownload(blob: Blob, suggestedName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = sanitiseFileName(suggestedName);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
