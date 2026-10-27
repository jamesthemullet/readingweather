import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DailyWeather } from '$lib/api/historicalWeather';
import type { OnThisDayPost } from '$lib/types';
import OnThisDay from './OnThisDay.svelte';

function makePost(overrides: Partial<OnThisDayPost> = {}): OnThisDayPost {
	return {
		title: 'A rainy forecast',
		slug: 'a-rainy-forecast',
		date: '2024-10-22T10:00:00.000Z',
		...overrides
	};
}

function makeWeather(overrides: Partial<DailyWeather> = {}): DailyWeather {
	return {
		year: 2024,
		tempMax: 15,
		tempMin: 8,
		precipitation: 0,
		windSpeedMax: 20,
		conditions: { morning: 'Cloudy', afternoon: 'Sunny', evening: 'Clear' },
		...overrides
	};
}

describe('OnThisDay', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-10-22T12:00:00.000Z'));
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('renders nothing when there are no posts from previous years', () => {
		const posts = [makePost({ date: '2026-10-22T10:00:00.000Z' })];

		render(OnThisDay, { props: { posts, historicalWeather: null } });

		expect(screen.queryByText('On This Day in Reading Weather')).toBeNull();
	});

	it('lists forecasts from previous years, keyed by their year', () => {
		const posts = [
			makePost({ title: 'A rainy forecast', slug: 'a-rainy-forecast', date: '2024-10-22T10:00:00.000Z' }),
			makePost({ title: 'This year', slug: 'this-year', date: '2026-10-22T10:00:00.000Z' })
		];

		render(OnThisDay, { props: { posts, historicalWeather: null } });

		expect(screen.getByText('On This Day in Reading Weather')).toBeTruthy();
		expect(screen.getByText('2024')).toBeTruthy();
		expect(screen.getByText('A rainy forecast')).toBeTruthy();
		expect(screen.queryByText('This year')).toBeNull();
	});

	it('does not render the actual-weather section when there is no historical weather', () => {
		const posts = [makePost()];

		render(OnThisDay, { props: { posts, historicalWeather: [] } });

		expect(screen.queryByText('Actual weather recorded')).toBeNull();
	});

	it('renders actual weather conditions when historical weather is provided', () => {
		const posts = [makePost()];
		const historicalWeather = [makeWeather()];

		render(OnThisDay, { props: { posts, historicalWeather } });

		expect(screen.getByText('Actual weather recorded')).toBeTruthy();
		expect(screen.getByText('15°C')).toBeTruthy();
		expect(screen.getByText('8°C')).toBeTruthy();
		expect(screen.getByText('20 km/h wind')).toBeTruthy();
		expect(screen.queryByText(/mm rain/)).toBeNull();
		expect(screen.getByText('Morning: Cloudy')).toBeTruthy();
	});

	it('shows rainfall only when precipitation is greater than zero', () => {
		const posts = [makePost()];
		const historicalWeather = [makeWeather({ precipitation: 4.2 })];

		render(OnThisDay, { props: { posts, historicalWeather } });

		expect(screen.getByText('4.2mm rain')).toBeTruthy();
	});
});
