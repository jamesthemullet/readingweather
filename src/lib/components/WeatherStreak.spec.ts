import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STREAK_KEY, type WeatherStreakResult } from '$lib/api/weatherStreak';
import WeatherStreak from './WeatherStreak.svelte';

function makeStreakResult(overrides: Partial<WeatherStreakResult> = {}): WeatherStreakResult {
	return {
		active: {
			type: 'dry',
			emoji: '☀️',
			length: 5,
			headline: 'Longest dry streak in 2 years',
			context: '5 days without rain',
			definition: 'No measurable rainfall recorded'
		},
		secondary: [],
		asOf: '9 July 2026',
		...overrides
	};
}

describe('WeatherStreak', () => {
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

		render(WeatherStreak);

		expect(screen.queryByText('Reading Weather Streak Tracker')).toBeNull();
	});

	it('renders the active streak once the API responds', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(makeStreakResult())
		} as Response);

		render(WeatherStreak);

		expect(await screen.findByText('Reading Weather Streak Tracker')).toBeTruthy();
		expect(screen.getByText('Longest dry streak in 2 years')).toBeTruthy();
		expect(screen.getByText('No measurable rainfall recorded')).toBeTruthy();
		expect(screen.getByText(/Streak measured through 9 July 2026/)).toBeTruthy();
	});

	it('renders secondary streaks when present', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: () =>
				Promise.resolve(
					makeStreakResult({
						secondary: [
							{
								type: 'sunny',
								emoji: '🌞',
								length: 3,
								headline: '3-day sunny streak',
								context: 'plenty of sunshine'
							}
						]
					})
				)
		} as Response);

		render(WeatherStreak);

		expect(await screen.findByText(/3-day sunny streak/)).toBeTruthy();
	});

	it('includes the streak definitions in the "What counts as a streak?" details', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(makeStreakResult())
		} as Response);

		render(WeatherStreak);

		await screen.findByText('Reading Weather Streak Tracker');

		expect(screen.getByText('What counts as a streak?')).toBeTruthy();
		expect(
			screen.getByText((_, element) => element?.textContent?.includes(STREAK_KEY[0].description) ?? false, {
				selector: 'li'
			})
		).toBeTruthy();
	});

	it('renders nothing when the request fails', async () => {
		vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

		render(WeatherStreak);

		await vi.waitFor(() => expect(fetch).toHaveBeenCalled());

		expect(screen.queryByText('Reading Weather Streak Tracker')).toBeNull();
	});
});
