import { describe, expect, it, vi } from 'vitest';
import { GET } from './+server';

vi.mock('$lib/api/historicalWeather', () => ({
	fetchHistoricalWeather: vi.fn().mockResolvedValue([
		{
			year: 2025,
			tempMax: 20,
			tempMin: 10,
			precipitation: 5,
			windSpeedMax: 15,
			conditions: { morning: 'clear sky', afternoon: 'partly cloudy', evening: 'mainly clear' }
		}
	])
}));

function makeEvent(params: Record<string, string> = {}) {
	const url = new URL('http://localhost/api/historical-weather');
	for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
	return { url } as Parameters<typeof GET>[0];
}

describe('GET /api/historical-weather', () => {
	it('returns 400 with an error message when month or day is missing', async () => {
		const response = await GET(makeEvent({ month: '6' }));
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe('month and day are required');
	});

	it('returns 200 with weather data when both month and day are provided', async () => {
		const response = await GET(makeEvent({ month: '6', day: '15' }));
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(Array.isArray(body)).toBe(true);
		expect(body[0].year).toBe(2025);
	});
});
