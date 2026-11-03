import { describe, expect, it } from 'vitest';
import { ensureImageAltText } from './imageAlt';

describe('ensureImageAltText', () => {
	it('fills in alt text when the attribute is empty', () => {
		const html = '<img src="chart.png" alt="">';
		expect(ensureImageAltText(html)).toBe('<img src="chart.png" alt="Weather chart from a Reading Weather post">');
	});

	it('fills in alt text when the attribute is missing entirely', () => {
		const html = '<img src="chart.png">';
		expect(ensureImageAltText(html)).toBe('<img alt="Weather chart from a Reading Weather post" src="chart.png">');
	});

	it('leaves an existing, non-empty alt attribute untouched', () => {
		const html = '<img src="chart.png" alt="Pressure chart for Sunday">';
		expect(ensureImageAltText(html)).toBe(html);
	});

	it('accepts a custom fallback', () => {
		const html = '<img src="chart.png" alt="">';
		expect(ensureImageAltText(html, 'Custom fallback')).toBe('<img src="chart.png" alt="Custom fallback">');
	});

	it('handles multiple images independently', () => {
		const html = '<p><img src="a.png" alt=""><img src="b.png" alt="Already described"></p>';
		const result = ensureImageAltText(html);
		expect(result).toContain('<img src="a.png" alt="Weather chart from a Reading Weather post">');
		expect(result).toContain('<img src="b.png" alt="Already described">');
	});

	it('leaves content without any images unchanged', () => {
		const html = '<p>No images here.</p>';
		expect(ensureImageAltText(html)).toBe(html);
	});
});
