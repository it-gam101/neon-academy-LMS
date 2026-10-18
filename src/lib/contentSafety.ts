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

/**
 * Dispatch 4a: a pasted address often carries invisible characters — a leading space, or a right-to-left mark from a
 * Hebrew page — which made a valid https address fail the checks below (QA 2026-10-09). An address never contains raw
 * whitespace, so all of it is removed, with every invisible format character (Unicode category Cf: zero-width
 * spaces, direction marks, the byte-order mark).
 */
export function cleanUrl(url: string): string {
  return url.replace(/[\s\p{Cf}]/gu, '');
}

export const ALLOWED_VIDEO_HOST = 'www.youtube.com';

/**
 * Returns true only for https://www.youtube.com/embed/<11-char id> exactly.
 */
export function isAllowedVideoUrl(url: string): boolean {
  if (!url) return true; // Empty URL is allowed (optional)
  const pattern = /^https:\/\/www\.youtube\.com\/embed\/[a-zA-Z0-9_-]{11}(\?.*)?$/;
  return pattern.test(cleanUrl(url));
}

/**
 * Returns true only for an absolute https:// URL.
 */
export function isAllowedMediaUrl(url: string): boolean {
  if (!url) return true; // Empty URL is allowed (optional)
  return cleanUrl(url).startsWith('https://');
}

/** Item 115: an e-mail address — the shape the database's CHECK on org_settings.support_email accepts. */
export function isEmailAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Item 115: an https address with something after the scheme — the database's CHECK on org_settings.support_url. */
export function isHttpsAddress(value: string): boolean {
  return /^https:\/\/\S+$/.test(value);
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
