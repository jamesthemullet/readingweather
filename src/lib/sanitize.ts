import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizes HTML to prevent XSS before it's rendered via {@html}.
 *
 * Uses sanitize-html (a pure-JS parser, no DOM required) so it behaves the same
 * during SSR and on the client. A jsdom-backed DOMPurify was tried previously
 * but jsdom's dependency chain fails to load in the Vercel function runtime
 * (ERR_REQUIRE_ESM), which 500'd every server-rendered page.
 */
const options: sanitizeHtml.IOptions = {
	allowedTags: [
		...sanitizeHtml.defaults.allowedTags,
		'img',
		'picture',
		'source',
		'figure',
		'figcaption',
		'iframe'
	],
	allowedAttributes: {
		'*': ['class', 'id', 'style', 'title', 'aria-*', 'data-*'],
		a: ['href', 'name', 'target', 'rel'],
		img: ['src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading', 'decoding'],
		source: ['src', 'srcset', 'sizes', 'type', 'media'],
		iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'loading'],
		td: ['colspan', 'rowspan'],
		th: ['colspan', 'rowspan', 'scope']
	},
	allowedSchemes: ['http', 'https', 'mailto', 'tel'],
	allowedSchemesByTag: { img: ['http', 'https', 'data'] },
	// Only the Ko-fi support widget (see kofi.ts) may be embedded.
	allowedIframeHostnames: ['ko-fi.com'],
	allowIframeRelativeUrls: false
};

export function sanitize(html: string): string {
	return sanitizeHtml(html, options);
}
