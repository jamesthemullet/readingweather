import { expect, test } from '@playwright/test';

test.describe('newsletter subscription form', () => {
	test('shows error message when the server rejects the submission', async ({ page }) => {
		await page.route('**/api/subscribe', async (route) => {
			await route.fulfill({
				status: 400,
				contentType: 'application/json',
				body: JSON.stringify({ message: 'Name and a valid email address are required' })
			});
		});

		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.locator('#subscribe-name').fill('Alice');
		await page.locator('#subscribe-email').fill('alice@example.com');

		const responsePromise = page.waitForResponse((resp) => resp.url().includes('/api/subscribe'));
		await page.locator('#subscribe-form button[type="submit"]').click();
		await responsePromise;

		await expect(page.getByRole('status')).toHaveText(
			'Name and a valid email address are required'
		);
	});

	test('shows success message when the server confirms the subscription', async ({ page }) => {
		await page.route('**/api/subscribe', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ message: 'You have been subscribed successfully!' })
			});
		});

		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.locator('#subscribe-name').fill('Alice');
		await page.locator('#subscribe-email').fill('alice@example.com');
		await page.locator('#subscribe-form button[type="submit"]').click();

		await expect(page.getByRole('status')).toHaveText('You have been subscribed successfully!', {
			timeout: 10000
		});
	});
});
