import { describe, expect, it } from 'vitest';
import { injectKofiWidget } from './kofi';
import { sanitize } from './sanitize';

describe('sanitize', () => {
	it('strips script tags in the SSR (non-browser) context', () => {
		const html = '<p>Hello <strong>world</strong><script>alert(1)</script></p>';
		expect(sanitize(html)).toBe('<p>Hello <strong>world</strong></p>');
	});

	it('leaves already-safe markup unchanged', () => {
		const html = '<p>Hello <strong>world</strong></p>';
		expect(sanitize(html)).toBe(html);
	});

	it('strips inline event handlers and javascript: URLs', () => {
		const out = sanitize('<img src="x.jpg" onerror="alert(1)"><a href="javascript:alert(1)">x</a>');
		expect(out).not.toContain('onerror');
		expect(out).not.toContain('javascript:');
	});

	it('keeps WordPress images and figures', () => {
		const html =
			'<figure class="wp-block-image"><img src="https://example.com/a.jpg" alt="Sky" width="800" height="600" /><figcaption>Sky</figcaption></figure>';
		const out = sanitize(html);
		expect(out).toContain('<img src="https://example.com/a.jpg" alt="Sky" width="800" height="600" />');
		expect(out).toContain('<figcaption>Sky</figcaption>');
	});

	it('keeps the Ko-fi iframe but drops iframes from other hosts', () => {
		const withKofi = sanitize(injectKofiWidget('<p>a</p><p>b</p><p>c</p><p>d</p>'));
		expect(withKofi).toContain('<iframe');
		expect(withKofi).toContain('ko-fi.com');

		expect(sanitize('<iframe src="https://evil.example/x"></iframe>')).not.toContain('evil.example');
	});
});
