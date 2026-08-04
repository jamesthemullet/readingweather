import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';

type MonthEntry = { year: number; month: number };
type LoadResult = { months: MonthEntry[] };

function makeEvent() {
	return { setHeaders: vi.fn() } as unknown as Parameters<typeof load>[0];
}

describe('monthly-summary index load', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('lists months newest first, ending at the last fully completed month', async () => {
		vi.setSystemTime(new Date('2026-07-15T12:00:00Z'));

		const result = (await load(makeEvent())) as LoadResult;

		expect(result.months[0]).toEqual({ year: 2026, month: 6 });
		expect(result.months[1]).toEqual({ year: 2026, month: 5 });
	});

	it('rolls over into December of the previous year when the current month is January', async () => {
		vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));

		const result = (await load(makeEvent())) as LoadResult;

		expect(result.months[0]).toEqual({ year: 2025, month: 12 });
	});

	it('goes back only as far as the start year', async () => {
		vi.setSystemTime(new Date('2026-07-15T12:00:00Z'));

		const result = (await load(makeEvent())) as LoadResult;

		expect(result.months[result.months.length - 1]).toEqual({ year: 2020, month: 1 });
	});
});
