const READING_LAT = 51.4543;
const READING_LON = -0.9781;

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
	return Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
}

export type WeatherConditions = {
	morning: string;
	afternoon: string;
	evening: string;
};

export type DailyWeather = {
	year: number;
	tempMax: number;
	tempMin: number;
	precipitation: number;
	windSpeedMax: number;
	conditions: WeatherConditions;
};

async function fetchOneDay(dateStr: string): Promise<DailyWeather> {
	const params = new URLSearchParams({
		latitude: String(READING_LAT),
		longitude: String(READING_LON),
		start_date: dateStr,
		end_date: dateStr,
		daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
		hourly: 'weather_code',
		timezone: 'Europe/London'
	});

	const response = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`);
	if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);

	const data = await response.json();
	const { temperature_2m_max, temperature_2m_min, precipitation_sum, wind_speed_10m_max } =
		data.daily;

	const codes: number[] = data.hourly.weather_code;
	const conditions: WeatherConditions = {
		morning: WMO_LABELS[dominantCode(codes.slice(6, 12))] ?? 'unknown',
		afternoon: WMO_LABELS[dominantCode(codes.slice(12, 18))] ?? 'unknown',
		evening: WMO_LABELS[dominantCode(codes.slice(18, 24))] ?? 'unknown'
	};

	return {
		year: Number.parseInt(dateStr.slice(0, 4)),
		tempMax: Math.round(temperature_2m_max[0] * 10) / 10,
		tempMin: Math.round(temperature_2m_min[0] * 10) / 10,
		precipitation: Math.round(precipitation_sum[0] * 10) / 10,
		windSpeedMax: Math.round(wind_speed_10m_max[0] * 10) / 10,
		conditions
	};
}

export async function fetchHistoricalWeather(month: number, day: number): Promise<DailyWeather[]> {
	const currentYear = new Date().getFullYear();
	const pad = (n: number) => String(n).padStart(2, '0');
	const mmdd = `${pad(month)}-${pad(day)}`;

	const years = Array.from({ length: 6 }, (_, i) => currentYear - 6 + i);
	const dates = years.map((y) => `${y}-${mmdd}`);

	const settled: PromiseSettledResult<DailyWeather>[] = [];
	for (let i = 0; i < dates.length; i += 5) {
		const batch = await Promise.allSettled(dates.slice(i, i + 5).map(fetchOneDay));
		settled.push(...batch);
		if (i + 5 < dates.length) await new Promise((r) => setTimeout(r, 300));
	}

	return settled
		.filter((r): r is PromiseFulfilledResult<DailyWeather> => r.status === 'fulfilled')
		.map((r) => r.value)
		.sort((a, b) => b.year - a.year);
}
