import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WeeklyDigest as WeeklyDigestData } from '$lib/api/weeklyDigest';
import WeeklyDigest from './WeeklyDigest.svelte';

function makeDigest(overrides: Partial<WeeklyDigestData> = {}): WeeklyDigestData {
	return {
		startDate: '2026-10-12',
		endDate: '2026-10-18',
		tempHigh: 18,
		tempLow: 7,
		totalPrecipitation: 12.4,
		rainyDays: 2,
		rainyDayNames: ['Tuesday', 'Thursday'],
		sunniestDay: { day: 'Sunday', sunshineHours: 6.5 },
		cloudiestDay: { day: 'Wednesday', sunshineHours: 0.5 },
		dominantConditions: 'mild and mostly dry',
		...overrides
	};
}

describe('WeeklyDigest', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('renders nothing before the fetch resolves', () => {
		vi.mocked(fetch).mockReturnValue(new Promise(() => {}));

		render(WeeklyDigest);

		expect(screen.queryByText('Last Week in Reading')).toBeNull();
	});

	it('renders the weekly stats once the API responds', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(makeDigest())
		} as Response);

		render(WeeklyDigest);

		expect(await screen.findByText('Last Week in Reading')).toBeTruthy();
		expect(screen.getByText('12 October – 18 October')).toBeTruthy();
		expect(screen.getByText('18°C')).toBeTruthy();
		expect(screen.getByText('7°C')).toBeTruthy();
		expect(screen.getByText('12.4mm rain')).toBeTruthy();
		expect(screen.getByText('2 wet days')).toBeTruthy();
		expect(screen.getByText('Mild and mostly dry.')).toBeTruthy();
		expect(screen.getByText('Rain fell on Tuesday and Thursday.')).toBeTruthy();
	});

	it('omits the rainy-days tally and rain sentence when there was no rain', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(makeDigest({ rainyDays: 0, rainyDayNames: [] }))
		} as Response);

		render(WeeklyDigest);

		await screen.findByText('Last Week in Reading');

		expect(screen.queryByText(/wet day/)).toBeNull();
		expect(screen.queryByText(/Rain fell on/)).toBeNull();
	});

	it('renders nothing when the request fails', async () => {
		vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

		render(WeeklyDigest);

		await vi.waitFor(() => expect(fetch).toHaveBeenCalled());

		expect(screen.queryByText('Last Week in Reading')).toBeNull();
	});
});
