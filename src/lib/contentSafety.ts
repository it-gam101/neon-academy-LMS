// ModulePage renders text blocks through dangerouslySetInnerHTML and video/image/pdf
// through raw URLs. Content will soon be AI-generated, so the author is not a person.
// Strip on the way IN; never trust on the way out.

/**
 * Strips HTML tags from input, preserving plain text content.
 * Preserves newlines and **bold** markers which are our permitted markup.
 */
export function stripHtmlToText(input: string): string {
  if (input == null) return '';
  const doc = new DOMParser().parseFromString(input, 'text/html');
  return doc.body.textContent ?? '';
}

export const ALLOWED_VIDEO_HOST = 'www.youtube.com';

/**
 * Returns true only for https://www.youtube.com/embed/<11-char id> exactly.
 */
export function isAllowedVideoUrl(url: string): boolean {
  if (!url) return true; // Empty URL is allowed (optional)
  const pattern = /^https:\/\/www\.youtube\.com\/embed\/[a-zA-Z0-9_-]{11}(\?.*)?$/;
  return pattern.test(url);
}

/**
 * Returns true only for an absolute https:// URL.
 */
export function isAllowedMediaUrl(url: string): boolean {
  if (!url) return true; // Empty URL is allowed (optional)
  return url.startsWith('https://');
}

const NON_EMBEDDABLE_HOSTS = ['sharepoint.com', 'onedrive.live.com', '1drv.ms', 'drive.google.com', 'docs.google.com', 'dropbox.com'];

/**
 * Returns true if the URL is from a host that blocks embedding via X-Frame-Options / CSP.
 */
export function isNonEmbeddableHost(url: string): boolean {
  if (!url) return false;
  try {
    const h = new URL(url).hostname.toLowerCase();
    return NON_EMBEDDABLE_HOSTS.some((d) => h === d || h.endsWith('.' + d));
  } catch {
    return false;
  }
}
