import DOMPurify from 'dompurify';
import { browser } from '$app/environment';

/**
 * Sanitizes HTML to prevent XSS. On the server (SSR) the content is returned
 * as-is because DOMPurify requires a DOM environment; on the client it is
 * sanitized with DOMPurify before being rendered via {@html}.
 */
export function sanitize(html: string): string {
	if (!browser) return html;
	return DOMPurify.sanitize(html);
}
