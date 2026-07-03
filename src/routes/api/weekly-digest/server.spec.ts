import { describe, expect, it, vi } from 'vitest';
import { GET } from './+server';

vi.mock('$lib/api/weeklyDigest', () => ({
	fetchWeeklyDigest: vi.fn().mockResolvedValue({
		startDate: '2026-06-16',
		endDate: '2026-06-22',
		tempHigh: 22.3,
		tempLow: 8.5,
		totalPrecipitation: 8.1,
		rainyDays: 2,
		dominantConditions: 'partly cloudy'
	})
}));

describe('GET /api/weekly-digest', () => {
	it('returns 200 with the weekly digest', async () => {
		const response = await GET({} as Parameters<typeof GET>[0]);
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.dominantConditions).toBe('partly cloudy');
		expect(body.totalPrecipitation).toBe(8.1);
	});
});
