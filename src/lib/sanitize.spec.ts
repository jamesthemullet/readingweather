import { describe, expect, it } from 'vitest';
import { sanitize } from './sanitize';

describe('sanitize', () => {
	it('strips script tags in the SSR (non-browser) context, where the previous implementation skipped sanitization', () => {
		const html = '<p>Hello <strong>world</strong><script>alert(1)</script></p>';
		expect(sanitize(html)).toBe('<p>Hello <strong>world</strong></p>');
	});

	it('leaves already-safe markup unchanged', () => {
		const html = '<p>Hello <strong>world</strong></p>';
		expect(sanitize(html)).toBe(html);
	});
});
