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
