import { toDateStr } from '$lib/dateUtils';

const READING_LAT = 51.4543;
const READING_LON = -0.9781;

// ERA5 reanalysis coverage starts 1940-01-01.
const EARLIEST_YEAR = 1940;
const WINDOW_DAYS = 7;

// A single continuous-range request covering every year back to 1940 takes a few
// seconds to generate upstream, so give it more headroom than the 7-day digest fetch.
const REQUEST_TIMEOUT_MS = 15000;

type OpenMeteoArchiveResponse = {
	daily: {
		time: string[];
		temperature_2m_max: number[];
		temperature_2m_min: number[];
		precipitation_sum: number[];
	};
};

export type YearRecord = {
	year: number;
	value: number;
};

export type WeekInHistory = {
	windowLabel: string;
	yearsOfData: number;
	hottestDay: YearRecord;
	coldestDay: YearRecord;
	wettestWeek: YearRecord;
};

function sameWindowInYear(start: Date, end: Date, year: number): { start: Date; end: Date } {
	const yearStart = new Date(Date.UTC(year, start.getUTCMonth(), start.getUTCDate()));
	const spanDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
	const yearEnd = new Date(yearStart);
	yearEnd.setUTCDate(yearEnd.getUTCDate() + spanDays);
	return { start: yearStart, end: yearEnd };
}

export async function fetchWeekInHistory(now: Date = new Date()): Promise<WeekInHistory> {
	const end = new Date(now);
	end.setUTCDate(end.getUTCDate() - 1);
	const start = new Date(end);
	start.setUTCDate(start.getUTCDate() - (WINDOW_DAYS - 1));

	// The window itself already ends yesterday (see `end` above), so this year's window
	// is just as complete as any past year's and belongs in the comparison.
	const lastYear = now.getUTCFullYear();

	const rangeStart = sameWindowInYear(start, end, EARLIEST_YEAR).start;
	const rangeEnd = end;

	const params = new URLSearchParams({
		latitude: String(READING_LAT),
		longitude: String(READING_LON),
		start_date: toDateStr(rangeStart),
		end_date: toDateStr(rangeEnd),
		daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
		timezone: 'Europe/London'
	});

	const response = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`, {
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
	});
	if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);

	const data = (await response.json()) as OpenMeteoArchiveResponse;
	const { time, temperature_2m_max, temperature_2m_min, precipitation_sum } = data.daily;
	const indexByDate = new Map(time.map((dateStr, i) => [dateStr, i]));

	let hottestDay: YearRecord | null = null;
	let coldestDay: YearRecord | null = null;
	let wettestWeek: YearRecord | null = null;

	for (let year = EARLIEST_YEAR; year <= lastYear; year++) {
		const window = sameWindowInYear(start, end, year);
		const indices: number[] = [];
		for (let d = new Date(window.start); d <= window.end; d.setUTCDate(d.getUTCDate() + 1)) {
			const idx = indexByDate.get(toDateStr(d));
			if (idx !== undefined) indices.push(idx);
		}
		if (indices.length === 0) continue;

		const yearHigh = Math.max(...indices.map((i) => temperature_2m_max[i]));
		const yearLow = Math.min(...indices.map((i) => temperature_2m_min[i]));
		const yearRain =
			Math.round(indices.reduce((sum, i) => sum + precipitation_sum[i], 0) * 10) / 10;

		if (!hottestDay || yearHigh > hottestDay.value) hottestDay = { year, value: yearHigh };
		if (!coldestDay || yearLow < coldestDay.value) coldestDay = { year, value: yearLow };
		if (!wettestWeek || yearRain > wettestWeek.value) wettestWeek = { year, value: yearRain };
	}

	if (!hottestDay || !coldestDay || !wettestWeek) {
		throw new Error('No historical data available for this window');
	}

	const labelOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
	const windowLabel = `${start.toLocaleDateString('en-GB', labelOpts)} – ${end.toLocaleDateString('en-GB', labelOpts)}`;

	return {
		windowLabel,
		yearsOfData: lastYear - EARLIEST_YEAR + 1,
		hottestDay: { year: hottestDay.year, value: Math.round(hottestDay.value * 10) / 10 },
		coldestDay: { year: coldestDay.year, value: Math.round(coldestDay.value * 10) / 10 },
		wettestWeek
	};
}
