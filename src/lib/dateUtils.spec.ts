import { describe, expect, it } from 'vitest';
import { toDateStr } from './dateUtils';

describe('toDateStr', () => {
	it('returns a YYYY-MM-DD string for a mid-year date', () => {
		expect(toDateStr(new Date('2026-07-14T12:00:00Z'))).toBe('2026-07-14');
	});

	it('zero-pads a single-digit month', () => {
		expect(toDateStr(new Date('2026-01-15T12:00:00Z'))).toBe('2026-01-15');
	});

	it('zero-pads a single-digit day', () => {
		expect(toDateStr(new Date('2026-07-05T12:00:00Z'))).toBe('2026-07-05');
	});

	it('uses UTC — a time of 23:59:59Z does not roll over to the next day', () => {
		expect(toDateStr(new Date('2026-07-14T23:59:59Z'))).toBe('2026-07-14');
	});

	it('uses UTC — midnight exactly maps to the correct calendar date', () => {
		expect(toDateStr(new Date('2026-07-14T00:00:00Z'))).toBe('2026-07-14');
	});

	it('handles a leap-year date (29 February) correctly', () => {
		expect(toDateStr(new Date('2000-02-29T12:00:00Z'))).toBe('2000-02-29');
	});

	it('handles a year-end boundary (31 December) without rolling into the next year', () => {
		expect(toDateStr(new Date('2025-12-31T23:00:00Z'))).toBe('2025-12-31');
	});
});
