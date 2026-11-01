import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes HTML to prevent XSS before it's rendered via {@html}. Backed by a
 * jsdom instance during SSR, so the server-rendered HTML that gets hydrated is
 * sanitized too, not just client-side re-renders.
 */
export function sanitize(html: string): string {
	return DOMPurify.sanitize(html);
}
