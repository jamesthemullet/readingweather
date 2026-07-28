import { describe, expect, it } from 'vitest';
import { listMonthlySummaryMonths } from './monthlySummaryMonths';

describe('listMonthlySummaryMonths', () => {
	it('lists months newest first, ending at the last fully completed month', () => {
		const months = listMonthlySummaryMonths(new Date('2026-07-15T12:00:00Z'));

		expect(months[0]).toEqual({ year: 2026, month: 6 });
		expect(months[1]).toEqual({ year: 2026, month: 5 });
	});

	it('rolls over into December of the previous year when the current month is January', () => {
		const months = listMonthlySummaryMonths(new Date('2026-01-15T12:00:00Z'));

		expect(months[0]).toEqual({ year: 2025, month: 12 });
	});

	it('goes back only as far as the start year', () => {
		const months = listMonthlySummaryMonths(new Date('2026-07-15T12:00:00Z'));

		expect(months[months.length - 1]).toEqual({ year: 2020, month: 1 });
	});
});
