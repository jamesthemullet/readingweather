import { expect, test } from '@playwright/test';

test('archives page loads with correct heading', async ({ page }) => {
	await page.goto('/archives');
	await expect(page.locator('h1')).toHaveText('Weather Forecast Archives');
});

test('archives page shows a month selector', async ({ page }) => {
	await page.goto('/archives');
	await expect(page.locator('#archive-select')).toBeVisible();
});

test('clicking Archives nav link navigates to the archives page', async ({ page }) => {
	await page.goto('/');
	await page.click('a[href="/archives"]');
	await expect(page).toHaveURL(/\/archives/);
	await expect(page.locator('h1')).toHaveText('Weather Forecast Archives');
});

test('home page h1 contains the site name', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toContainText('Reading');
});
