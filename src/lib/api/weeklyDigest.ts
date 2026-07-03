const READING_LAT = 51.4543;
const READING_LON = -0.9781;

// ERA5 archive data can lag behind real-time, so the digest window ends
// yesterday rather than today to avoid missing/null data for the current,
// still-in-progress day.
const DATA_LAG_DAYS = 1;
const WINDOW_DAYS = 7;

// Fail fast rather than hanging until the platform's function timeout kicks in
// and returns a 504 with no useful error.
const REQUEST_TIMEOUT_MS = 5000;

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

// ERA5's weather-code cloud estimates run high (see the on-page disclaimer), so rather
// than categorise by weather code this compares actual recorded sunshine hours against
// possible daylight hours — a much more reliable "how sunny was it" signal.
function sunshineSummary(sunshineDurations: number[], daylightDurations: number[]): string {
	const totalSunshine = sunshineDurations.reduce((a, b) => a + b, 0);
	const totalDaylight = daylightDurations.reduce((a, b) => a + b, 0);
	if (totalDaylight === 0) return 'unsettled';

	const ratio = totalSunshine / totalDaylight;
	if (ratio >= 0.65) return 'mostly sunny';
	if (ratio >= 0.35) return 'a mix of sun and cloud';
	if (ratio >= 0.15) return 'mostly cloudy';
	return 'mostly overcast';
}

function weekdayName(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
}

function extremeSunshineDay(
	dates: string[],
	sunshineDurations: number[],
	daylightDurations: number[],
	pick: 'max' | 'min'
): DaySummary {
	let bestIndex = 0;
	for (let i = 1; i < dates.length; i++) {
		const ratio = sunshineDurations[i] / daylightDurations[i];
		const bestRatio = sunshineDurations[bestIndex] / daylightDurations[bestIndex];
		if (pick === 'max' ? ratio > bestRatio : ratio < bestRatio) bestIndex = i;
	}
	return {
		day: weekdayName(dates[bestIndex]),
		sunshineHours: Math.round((sunshineDurations[bestIndex] / 3600) * 10) / 10
	};
}

export type DaySummary = {
	day: string;
	sunshineHours: number;
};

export type WeeklyDigest = {
	startDate: string;
	endDate: string;
	tempHigh: number;
	tempLow: number;
	totalPrecipitation: number;
	rainyDays: number;
	rainyDayNames: string[];
	sunniestDay: DaySummary;
	cloudiestDay: DaySummary;
	dominantConditions: string;
};

function toDateStr(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export async function fetchWeeklyDigest(now: Date = new Date()): Promise<WeeklyDigest> {
	const end = new Date(now);
	end.setDate(end.getDate() - DATA_LAG_DAYS);
	const start = new Date(end);
	start.setDate(start.getDate() - (WINDOW_DAYS - 1));

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

	const rainyDayNames = time
		.filter((_, i) => precipitation_sum[i] >= 1)
		.map((dateStr) => weekdayName(dateStr));

	return {
		startDate: toDateStr(start),
		endDate: toDateStr(end),
		tempHigh: Math.round(Math.max(...temperature_2m_max) * 10) / 10,
		tempLow: Math.round(Math.min(...temperature_2m_min) * 10) / 10,
		totalPrecipitation: Math.round(precipitation_sum.reduce((a, b) => a + b, 0) * 10) / 10,
		rainyDays: rainyDayNames.length,
		rainyDayNames,
		sunniestDay: extremeSunshineDay(time, sunshine_duration, daylight_duration, 'max'),
		cloudiestDay: extremeSunshineDay(time, sunshine_duration, daylight_duration, 'min'),
		dominantConditions: sunshineSummary(sunshine_duration, daylight_duration)
	};
}
