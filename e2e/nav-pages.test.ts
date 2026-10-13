import { expect, test } from '@playwright/test';

test.describe('static nav pages load', () => {
	test('/gallery returns 200 with the gallery heading', async ({ page }) => {
		const response = await page.goto('/gallery');
		expect(response?.status()).toBe(200);
		await expect(page.locator('h1')).toHaveText('Photo Gallery');
	});

	test('/seasonal-forecasts returns 200 with the seasonal forecasts heading', async ({ page }) => {
		const response = await page.goto('/seasonal-forecasts');
		expect(response?.status()).toBe(200);
		await expect(page.locator('h1')).toHaveText('Seasonal Forecasts');
	});

	test('/monthly-summary returns 200 with the monthly summary heading', async ({ page }) => {
		const response = await page.goto('/monthly-summary');
		expect(response?.status()).toBe(200);
		await expect(page.locator('h1')).toHaveText('Monthly Weather Report Cards');
	});

	test('/about returns 200 with a visible heading', async ({ page }) => {
		const response = await page.goto('/about');
		expect(response?.status()).toBe(200);
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('h1')).not.toBeEmpty();
	});

	test('/photographs returns 200 with a visible heading', async ({ page }) => {
		const response = await page.goto('/photographs');
		expect(response?.status()).toBe(200);
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('h1')).not.toBeEmpty();
	});

	test('/useful-links returns 200 with a visible heading', async ({ page }) => {
		const response = await page.goto('/useful-links');
		expect(response?.status()).toBe(200);
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('h1')).not.toBeEmpty();
	});
});
