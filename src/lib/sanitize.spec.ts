import { describe, expect, it } from 'vitest';
import { sanitize } from './sanitize';

describe('sanitize', () => {
	it('returns HTML unchanged in SSR context where DOMPurify requires a DOM', () => {
		const html = '<p>Hello <strong>world</strong><script>alert(1)</script></p>';
		expect(sanitize(html)).toBe(html);
	});
});
