import { expect, test } from '@playwright/test';

test.describe('post detail comment flow', () => {
	test('submitting valid comment data shows a success message', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.locator('a.read-more').first().click();

		await page.route('**/api/comment', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ success: true })
			});
		});

		const form = page.locator('form.add-comment').first();
		await form.locator('input[name="name"]').fill('Alice');
		await form.locator('input[name="email"]').fill('alice@example.com');
		await form.locator('textarea[name="comment"]').fill('Great forecast, thanks!');
		await form.getByRole('button', { name: 'Post Comment' }).click();

		await expect(page.getByRole('status').first()).toHaveText(
			'Thanks! Your comment has been submitted and is awaiting approval.'
		);
	});

	test('submitting an invalid email shows the server error without reloading', async ({
		page
	}) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.locator('a.read-more').first().click();
		const postUrl = page.url();

		await page.route('**/api/comment', async (route) => {
			await route.fulfill({
				status: 400,
				contentType: 'application/json',
				body: JSON.stringify({
					message: 'Name, valid email, and comment content are required'
				})
			});
		});

		const form = page.locator('form.add-comment').first();
		await form.locator('input[name="name"]').fill('Alice');
		await form.locator('input[name="email"]').fill('not-a-real-email@example.com');
		await form.locator('textarea[name="comment"]').fill('Great forecast, thanks!');
		await form.getByRole('button', { name: 'Post Comment' }).click();

		await expect(page.getByRole('alert').first()).toHaveText(
			'Name, valid email, and comment content are required'
		);
		expect(page.url()).toBe(postUrl);
	});
});
