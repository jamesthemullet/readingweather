import { toDateStr } from '$lib/dateUtils';

const READING_LAT = 51.4543;
const READING_LON = -0.9781;

// ERA5 reanalysis coverage starts 1940-01-01.
const EARLIEST_YEAR = 1940;

// A single continuous-range request covering every year back to 1940 takes a few
// seconds to generate upstream, so give it more headroom than a single-day fetch.
const REQUEST_TIMEOUT_MS = 20000;

// A request spanning every year back to 1940 is heavy enough that browsing the site
// in quick succession can trip Open-Meteo's rate limit. Retry a 429 a couple of
// times, honouring Retry-After when the upstream sends one, rather than surfacing a
// spurious failure for what is otherwise a valid request.
const MAX_ATTEMPTS = 3;

// A record that doesn't quite land at #1 is still worth showing if it's close — this
// caps how far down the all-time ranking counts as a "near miss" worth surfacing.
const NEAR_MISS_MAX_RANK = 10;

type OpenMeteoArchiveResponse = {
	daily: {
		time: string[];
		temperature_2m_max: number[];
		temperature_2m_min: number[];
		precipitation_sum: number[];
	};
};

type DayEntry = {
	date: string;
	year: number;
	month: number;
	tempMax: number;
	tempMin: number;
	precipitation: number;
};

export type RecordMetricType = 'hottest' | 'coldest' | 'wettest';

type MetricDefinition = {
	type: RecordMetricType;
	emoji: string;
	unit: string;
	direction: 'desc' | 'asc';
	allTimeLabel: (value: number) => string;
	label: (monthName: string, value: number) => string;
	value: (d: DayEntry) => number;
};

// A "hottest day" record set by a mild winter month reads oddly — Reading's record
// high for December might only be 15°C, which isn't hot by any reasonable measure.
// Below this threshold the day is described as merely the "warmest" on record for
// its month, rather than "hottest".
const HOT_THRESHOLD_C = 26;

function hottestOrWarmest(value: number): string {
	return value >= HOT_THRESHOLD_C ? 'Hottest' : 'Warmest';
}

// Direction controls which end of the ranking counts as "the record" — the hottest
// and wettest days are the highest values, but the coldest night is the lowest, so
// its ranking runs the other way.
const METRIC_DEFINITIONS: MetricDefinition[] = [
	{
		type: 'hottest',
		emoji: '🌡️',
		unit: '°C',
		direction: 'desc',
		allTimeLabel: (value) => `${hottestOrWarmest(value)} day on record`,
		label: (monthName, value) => `${hottestOrWarmest(value)} ${monthName} day`,
		value: (d) => d.tempMax
	},
	{
		type: 'coldest',
		emoji: '❄️',
		unit: '°C',
		direction: 'asc',
		allTimeLabel: () => 'Coldest night on record',
		label: (monthName) => `Coldest ${monthName} night`,
		value: (d) => d.tempMin
	},
	{
		type: 'wettest',
		emoji: '🌧️',
		unit: 'mm',
		direction: 'desc',
		allTimeLabel: () => 'Wettest day on record',
		label: (monthName) => `Wettest ${monthName} day`,
		value: (d) => d.precipitation
	}
];

export type BrokenRecord = {
	date: string;
	metric: RecordMetricType;
	emoji: string;
	label: string;
	value: number;
	unit: string;
	previousValue: number;
	previousDate: string;
};

export type NearMiss = {
	date: string;
	metric: RecordMetricType;
	emoji: string;
	label: string;
	value: number;
	unit: string;
	rank: number;
	recordValue: number;
	recordDate: string;
};

export type AllTimeRecord = {
	metric: RecordMetricType;
	emoji: string;
	label: string;
	value: number;
	unit: string;
	date: string;
};

export type RecordsTrackerResult = {
	year: number;
	asOf: string;
	asOfDate: string;
	yearsOfData: number;
	brokenRecords: BrokenRecord[];
	nearMisses: NearMiss[];
	allTimeRecords: AllTimeRecord[];
};

function monthName(month: number): string {
	return new Date(Date.UTC(2000, month - 1, 1)).toLocaleDateString('en-GB', {
		month: 'long',
		timeZone: 'UTC'
	});
}

function round1(n: number): number {
	return Math.round(n * 10) / 10;
}

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

export async function fetchRecordsTracker(now: Date = new Date()): Promise<RecordsTrackerResult> {
	const end = new Date(now);
	end.setUTCDate(end.getUTCDate() - 1);
	const currentYear = end.getUTCFullYear();

	const params = new URLSearchParams({
		latitude: String(READING_LAT),
		longitude: String(READING_LON),
		start_date: `${EARLIEST_YEAR}-01-01`,
		end_date: toDateStr(end),
		daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
		timezone: 'Europe/London'
	});

	const response = await fetchArchive(`https://archive-api.open-meteo.com/v1/archive?${params}`);
	if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);

	const data = (await response.json()) as OpenMeteoArchiveResponse;
	const { time, temperature_2m_max, temperature_2m_min, precipitation_sum } = data.daily;

	if (time.length === 0) {
		throw new Error('No historical data available');
	}

	const entries: DayEntry[] = time.map((dateStr, i) => ({
		date: dateStr,
		year: Number(dateStr.slice(0, 4)),
		month: Number(dateStr.slice(5, 7)),
		tempMax: temperature_2m_max[i],
		tempMin: temperature_2m_min[i],
		precipitation: precipitation_sum[i]
	}));

	const entriesByMonth = new Map<number, DayEntry[]>();
	for (const entry of entries) {
		const bucket = entriesByMonth.get(entry.month);
		if (bucket) bucket.push(entry);
		else entriesByMonth.set(entry.month, [entry]);
	}

	const brokenRecords: BrokenRecord[] = [];
	const nearMisses: NearMiss[] = [];

	for (const def of METRIC_DEFINITIONS) {
		for (const [month, pool] of entriesByMonth) {
			const currentYearEntries = pool.filter((entry) => entry.year === currentYear);
			if (currentYearEntries.length === 0) continue;

			const sorted = [...pool].sort((a, b) =>
				def.direction === 'desc' ? def.value(b) - def.value(a) : def.value(a) - def.value(b)
			);
			const monthLabel = monthName(month);

			for (const entry of currentYearEntries) {
				const rank = sorted.findIndex((e) => e.date === entry.date) + 1;

				if (rank === 1) {
					const previous = sorted[1];
					brokenRecords.push({
						date: entry.date,
						metric: def.type,
						emoji: def.emoji,
						label: def.label(monthLabel, def.value(entry)),
						value: round1(def.value(entry)),
						unit: def.unit,
						previousValue: round1(def.value(previous)),
						previousDate: previous.date
					});
				} else if (rank >= 2 && rank <= NEAR_MISS_MAX_RANK) {
					const record = sorted[0];
					nearMisses.push({
						date: entry.date,
						metric: def.type,
						emoji: def.emoji,
						label: def.label(monthLabel, def.value(entry)),
						value: round1(def.value(entry)),
						unit: def.unit,
						rank,
						recordValue: round1(def.value(record)),
						recordDate: record.date
					});
				}
			}
		}
	}

	brokenRecords.sort((a, b) => (a.date < b.date ? 1 : -1));
	nearMisses.sort((a, b) => (a.date < b.date ? 1 : -1));

	const allTimeRecords: AllTimeRecord[] = METRIC_DEFINITIONS.map((def) => {
		const best = entries.reduce((acc, entry) =>
			(def.direction === 'desc' ? def.value(entry) > def.value(acc) : def.value(entry) < def.value(acc))
				? entry
				: acc
		);
		return {
			metric: def.type,
			emoji: def.emoji,
			label: def.allTimeLabel(def.value(best)),
			value: round1(def.value(best)),
			unit: def.unit,
			date: best.date
		};
	});

	const asOf = new Date(time[time.length - 1]).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	});

	return {
		year: currentYear,
		asOf,
		asOfDate: time[time.length - 1],
		yearsOfData: currentYear - EARLIEST_YEAR + 1,
		brokenRecords,
		nearMisses,
		allTimeRecords
	};
}
