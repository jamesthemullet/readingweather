// Monthly report cards are only offered from the site's launch year onward,
// even though the underlying ERA5 data goes back to 1940.
export const MONTHLY_SUMMARY_START_YEAR = 2020;

export type MonthEntry = { year: number; month: number };

export function lastCompletedMonth(now: Date): MonthEntry {
	const year = now.getUTCFullYear();
	const month = now.getUTCMonth() + 1;
	return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

export function getMonthlySummaryMonths(now: Date = new Date()): MonthEntry[] {
	const last = lastCompletedMonth(now);

	const months: MonthEntry[] = [];
	for (let year = last.year; year >= MONTHLY_SUMMARY_START_YEAR; year--) {
		const firstMonth = year === last.year ? last.month : 12;
		for (let month = firstMonth; month >= 1; month--) {
			months.push({ year, month });
		}
	}

	return months;
}
