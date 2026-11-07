import { expect, test } from '@playwright/test';

test.describe('mobile navigation (375px viewport)', () => {
	test.use({ viewport: { width: 375, height: 667 } });

	test('home page has no horizontal overflow', async ({ page }) => {
		await page.goto('/');

		const hasHorizontalOverflow = await page.evaluate(
			() => document.documentElement.scrollWidth > document.documentElement.clientWidth
		);
		expect(hasHorizontalOverflow).toBe(false);
	});

	test('opening the menu reveals all nav links without overlapping the home link', async ({
		page
	}) => {
		await page.goto('/');

		const menuButton = page.getByRole('button', { name: 'Open navigation menu' });
		const homeLink = page.getByRole('link', { name: 'Home' });

		await menuButton.click();
		await expect(page.getByRole('button', { name: 'Close navigation menu' })).toBeVisible();

		const navMenu = page.locator('#nav-menu');
		await expect(navMenu).toBeVisible();
		await expect(navMenu.getByRole('link', { name: 'Archives', exact: true })).toBeVisible();

		const homeBox = await homeLink.boundingBox();
		const menuBox = await navMenu.boundingBox();
		expect(homeBox).not.toBeNull();
		expect(menuBox).not.toBeNull();

		const overlaps =
			!!homeBox &&
			!!menuBox &&
			homeBox.x < menuBox.x + menuBox.width &&
			homeBox.x + homeBox.width > menuBox.x &&
			homeBox.y < menuBox.y + menuBox.height &&
			homeBox.y + homeBox.height > menuBox.y;
		expect(overlaps).toBe(false);
	});

	test('a link in the open mobile menu navigates correctly', async ({ page }) => {
		await page.goto('/');

		await page.getByRole('button', { name: 'Open navigation menu' }).click();
		await page.locator('#nav-menu').getByRole('link', { name: 'Archives', exact: true }).click();

		await expect(page).toHaveURL(/\/archives/);
		await expect(page.locator('h1')).toHaveText('Weather Forecast Archives');
	});
});
