import { describe, expect, it } from 'vitest';
import { injectKofiWidget } from './kofi';

function makeParagraphs(n: number): string {
	return Array.from({ length: n }, (_, i) => `<p>Paragraph ${i + 1}</p>`).join('');
}

describe('injectKofiWidget', () => {
	it('returns empty string when content has no paragraphs', () => {
		expect(injectKofiWidget('')).toBe('');
	});

	it('does not inject the widget when content has fewer than 3 paragraphs', () => {
		const result = injectKofiWidget(makeParagraphs(2));
		expect(result).not.toContain('kofiframe');
	});

	it('injects the Ko-fi iframe when content has exactly 3 paragraphs', () => {
		const result = injectKofiWidget(makeParagraphs(3));
		expect(result).toContain('kofiframe');
	});

	it('injects the Ko-fi iframe when content has more than 3 paragraphs', () => {
		const result = injectKofiWidget(makeParagraphs(6));
		expect(result).toContain('kofiframe');
	});

	it('places the widget before the last 3 paragraphs, not at the end', () => {
		const result = injectKofiWidget(makeParagraphs(5));
		const kofiPos = result.indexOf('kofiframe');
		const lastParaPos = result.lastIndexOf('<p>Paragraph 5</p>');
		expect(kofiPos).toBeLessThan(lastParaPos);
		// The last 3 paragraphs (3, 4, 5) appear after the widget
		expect(result.indexOf('<p>Paragraph 3</p>')).toBeGreaterThan(kofiPos);
	});

	it('preserves all original paragraphs in the output', () => {
		const result = injectKofiWidget(makeParagraphs(4));
		for (let i = 1; i <= 4; i++) {
			expect(result).toContain(`Paragraph ${i}`);
		}
	});
});
