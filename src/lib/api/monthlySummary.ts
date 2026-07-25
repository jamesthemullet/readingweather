import { toDateStr } from '$lib/dateUtils';
import { getCache, setCache } from '$lib/server/cache';

const READING_LAT = 51.4543;
const READING_LON = -0.9781;

// ERA5 reanalysis coverage starts 1940-01-01.
const EARLIEST_YEAR = 1940;

// A single continuous-range request covering every year back to 1940 takes a few
// seconds to generate upstream, so give it more headroom than the 7-day digest fetch.
const REQUEST_TIMEOUT_MS = 20000;

// The multi-decade historical comparison for a given calendar month is the same no
// matter which year's report card is being viewed, so it's cached independently of
// the requested year and reused across every /monthly-summary/*/06 page there is.
// It's keyed on the last complete year included (see lastCompleteYearForMonth), which
// only advances once a year, so this is effectively immutable for a long stretch.
const BASELINE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type OpenMeteoArchiveResponse = {
	daily: {
		time: string[];
		temperature_2m_max: number[];
		temperature_2m_min: number[];
		temperature_2m_mean: number[];
		precipitation_sum: number[];
		sunshine_duration: number[];
	};
};

export type DayRecord = {
	date: string;
	year: number;
	value: number;
};

export type MonthlySummary = {
	year: number;
	month: number;
	monthName: string;
	label: string;
	yearsOfData: number;
	temperature: {
		high: number;
		low: number;
		mean: number;
		historicalAverageMean: number;
	};
	rainfall: {
		total: number;
		wettestDay: { date: string; value: number };
		historicalAverageTotal: number;
	};
	sunshine: {
		totalHours: number;
		sunniestDay: { date: string; hours: number };
		historicalAverageHours: number;
	};
	temperatureRank: number;
	headline: string;
	records: {
		hottestDay: DayRecord;
		coldestDay: DayRecord;
		wettestDay: DayRecord;
	};
};

type YearStats = {
	year: number;
	high: number;
	low: number;
	mean: number;
	rain: number;
	sunshineHours: number;
	wettestDay: { date: string; value: number };
	sunniestDay: { date: string; hours: number };
};

type MonthlyBaseline = {
	yearStats: YearStats[];
	hottestDay: DayRecord;
	coldestDay: DayRecord;
	wettestDay: DayRecord;
};

function monthBounds(year: number, month: number): { start: Date; end: Date } {
	const start = new Date(Date.UTC(year, month - 1, 1));
	const end = new Date(Date.UTC(year, month, 0));
	return { start, end };
}

function ordinal(n: number): string {
	const remainder100 = n % 100;
	if (remainder100 >= 11 && remainder100 <= 13) return `${n}th`;
	switch (n % 10) {
		case 1:
			return `${n}st`;
		case 2:
			return `${n}nd`;
		case 3:
			return `${n}rd`;
		default:
			return `${n}th`;
	}
}

function indicesInRange(indexByDate: Map<string, number>, start: Date, end: Date): number[] {
	const indices: number[] = [];
	for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
		const idx = indexByDate.get(toDateStr(d));
		if (idx !== undefined) indices.push(idx);
	}
	return indices;
}

// The last year for which `month` has fully played out in real life — this is the
// upper bound of every historical baseline, independent of whichever year's report
// card a visitor happens to be looking at.
function lastCompleteYearForMonth(month: number, now: Date): number {
	const currentYear = now.getUTCFullYear();
	const yesterday = new Date(now);
	yesterday.setUTCDate(yesterday.getUTCDate() - 1);
	return monthBounds(currentYear, month).end <= yesterday ? currentYear : currentYear - 1;
}

// A request spanning every year back to 1940 is heavy enough that browsing between
// several months in quick succession can trip Open-Meteo's rate limit. Retry a 429 a
// couple of times, honouring Retry-After when the upstream sends one, rather than
// surfacing a spurious failure for what is otherwise a valid request.
const MAX_ATTEMPTS = 3;

async function fetchArchive(url: string): Promise<Response> {
	let response: Response | undefined;
	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
		if (response.status !== 429 || attempt === MAX_ATTEMPTS) return response;

		const retryAfterSeconds = Number(response.headers.get('retry-after'));
		const delayMs = retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : attempt * 1000;
		await new Promise((resolve) => setTimeout(resolve, delayMs));
	}
	return response as Response;
}

async function fetchMonthlyBaseline(month: number, upToYear: number): Promise<MonthlyBaseline> {
	const cacheKey = `monthly-baseline-${month}-${upToYear}`;
	const cached = getCache<MonthlyBaseline>(cacheKey);
	if (cached) return cached;

	const rangeStart = new Date(Date.UTC(EARLIEST_YEAR, month - 1, 1));
	const rangeEnd = monthBounds(upToYear, month).end;

	const params = new URLSearchParams({
		latitude: String(READING_LAT),
		longitude: String(READING_LON),
		start_date: toDateStr(rangeStart),
		end_date: toDateStr(rangeEnd),
		daily:
			'temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,sunshine_duration',
		timezone: 'Europe/London'
	});

	const response = await fetchArchive(`https://archive-api.open-meteo.com/v1/archive?${params}`);
	if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);

	const data = (await response.json()) as OpenMeteoArchiveResponse;
	const {
		time,
		temperature_2m_max,
		temperature_2m_min,
		temperature_2m_mean,
		precipitation_sum,
		sunshine_duration
	} = data.daily;
	const indexByDate = new Map(time.map((dateStr, i) => [dateStr, i]));

	const yearStats: YearStats[] = [];
	let hottestDay: DayRecord | null = null;
	let coldestDay: DayRecord | null = null;
	let wettestDay: DayRecord | null = null;

	for (let y = EARLIEST_YEAR; y <= upToYear; y++) {
		const bounds = monthBounds(y, month);
		const indices = indicesInRange(indexByDate, bounds.start, bounds.end);
		if (indices.length === 0) continue;

		const high = Math.max(...indices.map((i) => temperature_2m_max[i]));
		const low = Math.min(...indices.map((i) => temperature_2m_min[i]));
		const mean = indices.reduce((sum, i) => sum + temperature_2m_mean[i], 0) / indices.length;
		const rain = indices.reduce((sum, i) => sum + precipitation_sum[i], 0);
		const sunshineHours = indices.reduce((sum, i) => sum + sunshine_duration[i], 0) / 3600;

		let wettestIdx = indices[0];
		let sunniestIdx = indices[0];
		for (const i of indices) {
			if (precipitation_sum[i] > precipitation_sum[wettestIdx]) wettestIdx = i;
			if (sunshine_duration[i] > sunshine_duration[sunniestIdx]) sunniestIdx = i;

			const date = time[i];
			if (!hottestDay || temperature_2m_max[i] > hottestDay.value) {
				hottestDay = { date, year: y, value: Math.round(temperature_2m_max[i] * 10) / 10 };
			}
			if (!coldestDay || temperature_2m_min[i] < coldestDay.value) {
				coldestDay = { date, year: y, value: Math.round(temperature_2m_min[i] * 10) / 10 };
			}
			if (!wettestDay || precipitation_sum[i] > wettestDay.value) {
				wettestDay = { date, year: y, value: Math.round(precipitation_sum[i] * 10) / 10 };
			}
		}

		yearStats.push({
			year: y,
			high,
			low,
			mean,
			rain,
			sunshineHours,
			wettestDay: {
				date: time[wettestIdx],
				value: Math.round(precipitation_sum[wettestIdx] * 10) / 10
			},
			sunniestDay: {
				date: time[sunniestIdx],
				hours: Math.round((sunshine_duration[sunniestIdx] / 3600) * 10) / 10
			}
		});
	}

	if (!hottestDay || !coldestDay || !wettestDay) {
		throw new Error('No historical data available for this month');
	}

	const baseline: MonthlyBaseline = { yearStats, hottestDay, coldestDay, wettestDay };
	setCache(cacheKey, baseline, BASELINE_TTL_MS);
	return baseline;
}

export async function fetchMonthlySummary(
	year: number,
	month: number,
	now: Date = new Date()
): Promise<MonthlySummary> {
	const { start, end } = monthBounds(year, month);

	const yesterday = new Date(now);
	yesterday.setUTCDate(yesterday.getUTCDate() - 1);
	if (end > yesterday) {
		throw new Error('Monthly summary is only available for fully completed months');
	}

	// The requested year's own month is, by construction, already within
	// 1940..lastCompleteYearForMonth, so the baseline always has an entry for it —
	// no separate network call is needed to fetch that specific month's own data.
	const baseline = await fetchMonthlyBaseline(month, lastCompleteYearForMonth(month, now));

	const targetYearStats = baseline.yearStats.find((s) => s.year === year);
	if (!targetYearStats) {
		throw new Error('No historical data available for this month');
	}

	const historicalAverageMean =
		baseline.yearStats.reduce((sum, s) => sum + s.mean, 0) / baseline.yearStats.length;
	const historicalAverageTotal =
		baseline.yearStats.reduce((sum, s) => sum + s.rain, 0) / baseline.yearStats.length;
	const historicalAverageHours =
		baseline.yearStats.reduce((sum, s) => sum + s.sunshineHours, 0) / baseline.yearStats.length;

	const rankedByMean = [...baseline.yearStats].sort((a, b) => b.mean - a.mean);
	const temperatureRank = rankedByMean.findIndex((s) => s.year === year) + 1;

	const monthName = start.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' });

	return {
		year,
		month,
		monthName,
		label: `${monthName} ${year}`,
		yearsOfData: baseline.yearStats.length,
		temperature: {
			high: Math.round(targetYearStats.high * 10) / 10,
			low: Math.round(targetYearStats.low * 10) / 10,
			mean: Math.round(targetYearStats.mean * 10) / 10,
			historicalAverageMean: Math.round(historicalAverageMean * 10) / 10
		},
		rainfall: {
			total: Math.round(targetYearStats.rain * 10) / 10,
			wettestDay: targetYearStats.wettestDay,
			historicalAverageTotal: Math.round(historicalAverageTotal * 10) / 10
		},
		sunshine: {
			totalHours: Math.round(targetYearStats.sunshineHours * 10) / 10,
			sunniestDay: targetYearStats.sunniestDay,
			historicalAverageHours: Math.round(historicalAverageHours * 10) / 10
		},
		temperatureRank,
		headline: `${monthName} ${year} was the ${ordinal(temperatureRank)} warmest ${monthName} in Reading since ${EARLIEST_YEAR}`,
		records: {
			hottestDay: baseline.hottestDay,
			coldestDay: baseline.coldestDay,
			wettestDay: baseline.wettestDay
		}
	};
}
