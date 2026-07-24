import { toDateStr } from '$lib/dateUtils';

const READING_LAT = 51.4543;
const READING_LON = -0.9781;

// ERA5 reanalysis coverage starts 1940-01-01.
const EARLIEST_YEAR = 1940;

// A single continuous-range request covering every year back to 1940 takes a few
// seconds to generate upstream, so give it more headroom than the 7-day digest fetch.
const REQUEST_TIMEOUT_MS = 15000;

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

	const rangeStart = new Date(Date.UTC(EARLIEST_YEAR, month - 1, 1));

	const params = new URLSearchParams({
		latitude: String(READING_LAT),
		longitude: String(READING_LON),
		start_date: toDateStr(rangeStart),
		end_date: toDateStr(end),
		daily:
			'temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,sunshine_duration',
		timezone: 'Europe/London'
	});

	const response = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`, {
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
	});
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

	for (let y = EARLIEST_YEAR; y <= year; y++) {
		const bounds = monthBounds(y, month);
		const indices = indicesInRange(indexByDate, bounds.start, bounds.end);
		if (indices.length === 0) continue;

		const high = Math.max(...indices.map((i) => temperature_2m_max[i]));
		const low = Math.min(...indices.map((i) => temperature_2m_min[i]));
		const mean = indices.reduce((sum, i) => sum + temperature_2m_mean[i], 0) / indices.length;
		const rain = indices.reduce((sum, i) => sum + precipitation_sum[i], 0);
		const sunshineHours = indices.reduce((sum, i) => sum + sunshine_duration[i], 0) / 3600;
		yearStats.push({ year: y, high, low, mean, rain, sunshineHours });

		for (const i of indices) {
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
	}

	const targetYearStats = yearStats.find((s) => s.year === year);
	if (!targetYearStats || !hottestDay || !coldestDay || !wettestDay) {
		throw new Error('No historical data available for this month');
	}

	const historicalAverageMean = yearStats.reduce((sum, s) => sum + s.mean, 0) / yearStats.length;
	const historicalAverageTotal = yearStats.reduce((sum, s) => sum + s.rain, 0) / yearStats.length;
	const historicalAverageHours =
		yearStats.reduce((sum, s) => sum + s.sunshineHours, 0) / yearStats.length;

	const rankedByMean = [...yearStats].sort((a, b) => b.mean - a.mean);
	const temperatureRank = rankedByMean.findIndex((s) => s.year === year) + 1;

	const monthName = start.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' });

	const targetIndices = indicesInRange(indexByDate, start, end);
	let wettestDayIdx = targetIndices[0];
	let sunniestDayIdx = targetIndices[0];
	for (const i of targetIndices) {
		if (precipitation_sum[i] > precipitation_sum[wettestDayIdx]) wettestDayIdx = i;
		if (sunshine_duration[i] > sunshine_duration[sunniestDayIdx]) sunniestDayIdx = i;
	}

	return {
		year,
		month,
		monthName,
		label: `${monthName} ${year}`,
		yearsOfData: yearStats.length,
		temperature: {
			high: Math.round(targetYearStats.high * 10) / 10,
			low: Math.round(targetYearStats.low * 10) / 10,
			mean: Math.round(targetYearStats.mean * 10) / 10,
			historicalAverageMean: Math.round(historicalAverageMean * 10) / 10
		},
		rainfall: {
			total: Math.round(targetYearStats.rain * 10) / 10,
			wettestDay: {
				date: time[wettestDayIdx],
				value: Math.round(precipitation_sum[wettestDayIdx] * 10) / 10
			},
			historicalAverageTotal: Math.round(historicalAverageTotal * 10) / 10
		},
		sunshine: {
			totalHours: Math.round(targetYearStats.sunshineHours * 10) / 10,
			sunniestDay: {
				date: time[sunniestDayIdx],
				hours: Math.round((sunshine_duration[sunniestDayIdx] / 3600) * 10) / 10
			},
			historicalAverageHours: Math.round(historicalAverageHours * 10) / 10
		},
		temperatureRank,
		headline: `${monthName} ${year} was the ${ordinal(temperatureRank)} warmest ${monthName} in Reading since ${EARLIEST_YEAR}`,
		records: {
			hottestDay,
			coldestDay,
			wettestDay
		}
	};
}
