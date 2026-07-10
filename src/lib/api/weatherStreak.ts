const READING_LAT = 51.4543;
const READING_LON = -0.9781;

// How far back we look for a comparable historical streak of the same length.
const HISTORY_YEARS = 10;

// A single continuous-range request covering ten years takes a few seconds to
// generate upstream, so give it more headroom than a single-day fetch.
const REQUEST_TIMEOUT_MS = 15000;

type OpenMeteoArchiveResponse = {
	daily: {
		time: string[];
		temperature_2m_max: number[];
		temperature_2m_min: number[];
		precipitation_sum: number[];
		sunshine_duration: number[];
		daylight_duration: number[];
	};
};

type DayMetrics = {
	tempMax: number;
	tempMin: number;
	precipitation: number;
	// Fraction of daylight hours that saw genuine sunshine (irradiance above the
	// WMO threshold). A flat hour count is useless here: Reading's midsummer days
	// are ~16.5h long, so "sunshine_duration > 6h" was true on almost every day of
	// the year regardless of actual cloud cover, including a 19.4mm rain day. The
	// ratio to daylight length is what actually distinguishes a sunny day from an
	// overcast one, in any season.
	sunshineRatio: number;
};

type StreakType = 'dry' | 'wet' | 'warm' | 'cold' | 'frost' | 'sunny';

type StreakDefinition = {
	type: StreakType;
	emoji: string;
	label: (n: number) => string;
	test: (day: DayMetrics) => boolean;
};

const STREAK_DEFINITIONS: StreakDefinition[] = [
	{
		type: 'dry',
		emoji: '☀️',
		label: (n) => `${n} consecutive dry day${n === 1 ? '' : 's'} in Reading`,
		test: (d) => d.precipitation < 0.5
	},
	{
		type: 'wet',
		emoji: '🌧️',
		label: (n) => `${n} consecutive day${n === 1 ? '' : 's'} of rain in Reading`,
		test: (d) => d.precipitation >= 1
	},
	{
		type: 'warm',
		emoji: '🔥',
		label: (n) => `${n} day${n === 1 ? '' : 's'} above 25°C in Reading`,
		test: (d) => d.tempMax >= 25
	},
	{
		type: 'cold',
		emoji: '🥶',
		label: (n) => `${n} day${n === 1 ? '' : 's'} below 5°C in Reading`,
		test: (d) => d.tempMax < 5
	},
	{
		type: 'frost',
		emoji: '❄️',
		label: (n) => `${n} consecutive night${n === 1 ? '' : 's'} of frost in Reading`,
		test: (d) => d.tempMin < 0
	},
	{
		type: 'sunny',
		emoji: '🌞',
		label: (n) => `${n} sunny day${n === 1 ? '' : 's'} in a row in Reading`,
		test: (d) => d.sunshineRatio > 0.6
	}
];

export type Streak = {
	type: StreakType;
	emoji: string;
	length: number;
	headline: string;
	context: string;
};

export type WeatherStreakResult = {
	active: Streak;
	secondary: Streak[];
};

type Run = { startIndex: number; endIndex: number; length: number };

function toDateStr(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function findRuns(matches: boolean[]): Run[] {
	const runs: Run[] = [];
	let runStart = -1;
	for (let i = 0; i < matches.length; i++) {
		if (matches[i]) {
			if (runStart === -1) runStart = i;
		} else if (runStart !== -1) {
			runs.push({ startIndex: runStart, endIndex: i - 1, length: i - runStart });
			runStart = -1;
		}
	}
	if (runStart !== -1) {
		runs.push({ startIndex: runStart, endIndex: matches.length - 1, length: matches.length - runStart });
	}
	return runs;
}

function buildContext(currentLength: number, priorRuns: Run[], dates: string[], currentYear: number): string {
	const atLeastAsLong = priorRuns
		.filter((r) => r.length >= currentLength)
		.sort((a, b) => b.endIndex - a.endIndex);

	if (atLeastAsLong.length === 0) {
		return `the longest in at least ${HISTORY_YEARS} years of records`;
	}

	const year = new Date(dates[atLeastAsLong[0].endIndex]).getUTCFullYear();
	// A match found earlier in the same year isn't a meaningful "since <year>" —
	// that phrasing only makes sense pointing back at a previous year.
	return year === currentYear ? 'the longest so far this year' : `the longest since ${year}`;
}

export async function fetchWeatherStreak(now: Date = new Date()): Promise<WeatherStreakResult | null> {
	const end = new Date(now);
	end.setUTCDate(end.getUTCDate() - 1);
	const start = new Date(end);
	start.setUTCFullYear(start.getUTCFullYear() - HISTORY_YEARS);

	const params = new URLSearchParams({
		latitude: String(READING_LAT),
		longitude: String(READING_LON),
		start_date: toDateStr(start),
		end_date: toDateStr(end),
		daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,sunshine_duration,daylight_duration',
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
		precipitation_sum,
		sunshine_duration,
		daylight_duration
	} = data.daily;

	const days: DayMetrics[] = time.map((_, i) => ({
		tempMax: temperature_2m_max[i],
		tempMin: temperature_2m_min[i],
		precipitation: precipitation_sum[i],
		sunshineRatio: sunshine_duration[i] / daylight_duration[i]
	}));

	const currentYear = end.getUTCFullYear();
	const candidates: { def: StreakDefinition; length: number; context: string }[] = [];

	for (const def of STREAK_DEFINITIONS) {
		const matches = days.map((d) => def.test(d));
		const runs = findRuns(matches);
		if (runs.length === 0) continue;

		const lastRun = runs[runs.length - 1];
		if (lastRun.endIndex !== matches.length - 1) continue;

		const priorRuns = runs.slice(0, -1);
		candidates.push({
			def,
			length: lastRun.length,
			context: buildContext(lastRun.length, priorRuns, time, currentYear)
		});
	}

	if (candidates.length === 0) return null;

	candidates.sort((a, b) => b.length - a.length);

	const toStreak = (c: (typeof candidates)[number]): Streak => ({
		type: c.def.type,
		emoji: c.def.emoji,
		length: c.length,
		headline: c.def.label(c.length),
		context: c.context
	});

	const [primary, ...rest] = candidates;
	return {
		active: toStreak(primary),
		secondary: rest.slice(0, 2).map(toStreak)
	};
}
