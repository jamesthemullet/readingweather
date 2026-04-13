import type { Handle } from '@sveltejs/kit';

const securityHeaders = {
	// Prevent this site from being embedded in iframes on other origins (clickjacking)
	'X-Frame-Options': 'SAMEORIGIN',

	// Stop browsers from MIME-sniffing the content type
	'X-Content-Type-Options': 'nosniff',

	// Only send origin (no path) in the Referer header for cross-origin requests
	'Referrer-Policy': 'strict-origin-when-cross-origin',

	// Restrict access to powerful browser APIs
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',

	// Content Security Policy
	// Notes on unsafe-inline for scripts: the Google Tag Manager snippet injected via
	// <svelte:head> in analytics.svelte is an inline script. Removing unsafe-inline
	// would require threading a nonce through to that script — a future improvement.
	'Content-Security-Policy': [
		"default-src 'self'",

		// Scripts: own origin + Google Analytics/GTM + AdSense
		// unsafe-inline is required by the GTM initialisation snippet
		"script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://www.google-analytics.com https://googleads.g.doubleclick.net",

		// Styles: own origin; unsafe-inline needed for Svelte's scoped styles
		"style-src 'self' 'unsafe-inline'",

		// Images: own origin, data URIs (inline images), WordPress media, ad networks
		"img-src 'self' data: https://blog.readingweather.co.uk https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.google.com https://www.gstatic.com",

		// Fonts: own origin only (fonts are self-hosted)
		"font-src 'self'",

		// Frames: Ko-Fi donation widget + AdSense ad iframes
		"frame-src https://ko-fi.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",

		// Fetch/XHR: own origin + WordPress GraphQL backend + Analytics beacons
		"connect-src 'self' https://blog.readingweather.co.uk https://www.google-analytics.com https://stats.g.doubleclick.net https://region1.google-analytics.com",

		// Disallow <object>, <embed>, <applet>
		"object-src 'none'",

		// Restrict <base> tag to same origin
		"base-uri 'self'",

		// Limit where forms can be submitted
		"form-action 'self' https://blog.readingweather.co.uk"
	].join('; ')
};

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	for (const [header, value] of Object.entries(securityHeaders)) {
		response.headers.set(header, value);
	}

	return response;
};
