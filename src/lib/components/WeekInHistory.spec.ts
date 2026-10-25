import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WeekInHistory as WeekInHistoryData } from '$lib/api/weekInHistory';
import WeekInHistory from './WeekInHistory.svelte';

function makeHistory(overrides: Partial<WeekInHistoryData> = {}): WeekInHistoryData {
	return {
		windowLabel: '18–24 October',
		yearsOfData: 85,
		hottestDay: { value: 24.1, year: 2006 },
		coldestDay: { value: -3.2, year: 1993 },
		wettestWeek: { value: 42.5, year: 1987 },
		...overrides
	};
}

describe('WeekInHistory', () => {
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

		render(WeekInHistory);

		expect(screen.queryByText('This Week in Reading Weather History')).toBeNull();
	});

	it('renders the hottest, coldest and wettest records once the API responds', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(makeHistory())
		} as Response);

		render(WeekInHistory);

		expect(await screen.findByText('This Week in Reading Weather History')).toBeTruthy();
		expect(screen.getByText('18–24 October · 85 years of records')).toBeTruthy();
		expect(screen.getByText('24.1°C', { exact: false })).toBeTruthy();
		expect(screen.getByText('2006', { exact: false })).toBeTruthy();
		expect(screen.getByText('-3.2°C', { exact: false })).toBeTruthy();
		expect(screen.getByText('1993', { exact: false })).toBeTruthy();
		expect(screen.getByText('42.5mm', { exact: false })).toBeTruthy();
		expect(screen.getByText('1987', { exact: false })).toBeTruthy();
	});

	it('renders nothing when the request fails', async () => {
		vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

		render(WeekInHistory);

		await vi.waitFor(() => expect(fetch).toHaveBeenCalled());

		expect(screen.queryByText('This Week in Reading Weather History')).toBeNull();
	});
});
