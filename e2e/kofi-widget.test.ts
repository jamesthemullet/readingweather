import { expect, test } from '@playwright/test';

test.describe('Ko-fi widget layout (375px viewport)', () => {
	test.use({ viewport: { width: 375, height: 667 } });

	test('ko-fi iframe stays within the viewport on a post page', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.locator('a.read-more').first().click();
		await page.waitForURL((url) => url.pathname !== '/');

		const kofiFrame = page.locator('#kofiframe');
		if ((await kofiFrame.count()) === 0) {
			test.skip(true, 'this post is too short to include the Ko-fi widget');
		}

		const hasHorizontalOverflow = await page.evaluate(
			() => document.documentElement.scrollWidth > document.documentElement.clientWidth
		);
		expect(hasHorizontalOverflow).toBe(false);

		const box = await kofiFrame.boundingBox();
		expect(box).not.toBeNull();
		expect(!!box && box.x + box.width <= 375).toBe(true);
	});
});
