import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

const pageState = { url: new URL('https://www.readingweather.co.uk/') };

vi.mock('$app/state', () => ({
	get page() {
		return pageState;
	}
}));

import NavBar from './NavBar.svelte';

describe('NavBar', () => {
	afterEach(() => {
		cleanup();
		pageState.url = new URL('https://www.readingweather.co.uk/');
	});

	it('renders a link for every nav item plus the home button', () => {
		render(NavBar);

		expect(screen.getByRole('link', { name: 'Home' })).toHaveProperty('href', expect.any(String));
		expect(screen.getByRole('link', { name: 'Seasonal Forecasts' })).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Records' })).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Photographs' })).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Gallery' })).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Weather Links' })).toBeTruthy();
		expect(screen.getByRole('link', { name: 'About' })).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Archives' })).toBeTruthy();
	});

	it('marks the link matching the current path as current', () => {
		pageState.url = new URL('https://www.readingweather.co.uk/records');
		render(NavBar);

		expect(screen.getByRole('link', { name: 'Records' }).getAttribute('aria-current')).toBe(
			'page'
		);
		expect(screen.getByRole('link', { name: 'Gallery' }).getAttribute('aria-current')).toBeNull();
	});

	it('toggles the menu open and closed via the menu button', async () => {
		render(NavBar);

		const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });
		expect(menuButton.getAttribute('aria-expanded')).toBe('false');

		await fireEvent.click(menuButton);

		expect(
			screen.getByRole('button', { name: 'Close navigation menu' }).getAttribute('aria-expanded')
		).toBe('true');
	});

	it('closes an open menu when a nav link is clicked', async () => {
		render(NavBar);

		await fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
		expect(screen.getByRole('button', { name: 'Close navigation menu' })).toBeTruthy();

		await fireEvent.click(screen.getByRole('link', { name: 'Archives' }));

		expect(screen.getByRole('button', { name: 'Open navigation menu' })).toBeTruthy();
	});

	it('closes an open menu when Escape is pressed', async () => {
		render(NavBar);

		await fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
		expect(screen.getByRole('button', { name: 'Close navigation menu' })).toBeTruthy();

		await fireEvent.keyDown(window, { key: 'Escape' });

		expect(screen.getByRole('button', { name: 'Open navigation menu' })).toBeTruthy();
	});
});
