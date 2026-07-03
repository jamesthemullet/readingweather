const READING_LAT = 51.4543;
const READING_LON = -0.9781;

// ERA5 archive data typically lags a few days behind real-time, so the
// digest window ends a few days before today to avoid missing/null data.
const DATA_LAG_DAYS = 3;
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
		weather_code: number[];
	};
};

const WMO_LABELS: Record<number, string> = {
	0: 'clear sky',
	1: 'mainly clear',
	2: 'partly cloudy',
	3: 'overcast',
	45: 'fog',
	48: 'icy fog',
	51: 'light drizzle',
	53: 'drizzle',
	55: 'heavy drizzle',
	61: 'light rain',
	63: 'rain',
	65: 'heavy rain',
	71: 'light snow',
	73: 'snow',
	75: 'heavy snow',
	77: 'snow grains',
	80: 'light showers',
	81: 'showers',
	82: 'heavy showers',
	85: 'light snow showers',
	86: 'heavy snow showers',
	95: 'thunderstorm',
	96: 'thunderstorm & hail',
	99: 'thunderstorm & heavy hail'
};

function dominantCode(codes: number[]): number {
	const freq: Record<number, number> = {};
	for (const c of codes) freq[c] = (freq[c] ?? 0) + 1;
	const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
	return top ? Number(top[0]) : 0;
}

export type WeeklyDigest = {
	startDate: string;
	endDate: string;
	tempHigh: number;
	tempLow: number;
	totalPrecipitation: number;
	rainyDays: number;
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
		daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
		timezone: 'Europe/London'
	});

	const response = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`, {
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
	});
	if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);

	const data = (await response.json()) as OpenMeteoArchiveResponse;
	const { temperature_2m_max, temperature_2m_min, precipitation_sum, weather_code } = data.daily;

	const dominantLabel = WMO_LABELS[dominantCode(weather_code)] ?? 'unsettled';

	return {
		startDate: toDateStr(start),
		endDate: toDateStr(end),
		tempHigh: Math.round(Math.max(...temperature_2m_max) * 10) / 10,
		tempLow: Math.round(Math.min(...temperature_2m_min) * 10) / 10,
		totalPrecipitation: Math.round(precipitation_sum.reduce((a, b) => a + b, 0) * 10) / 10,
		rainyDays: precipitation_sum.filter((p) => p >= 1).length,
		dominantConditions: dominantLabel
	};
}
