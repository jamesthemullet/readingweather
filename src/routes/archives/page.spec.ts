import { describe, expect, it, vi } from 'vitest';
import { load } from './+page';

vi.mock('$lib/graphql/api', () => ({
	fetchGraphQL: vi.fn()
}));

function makeUrl(params: Record<string, string> = {}) {
	const url = new URL('http://localhost/archives');
	for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
	return url;
}

describe('archives load — generateArchives', () => {
	it('does not include any month beyond the current date', async () => {
		const { archives } = await load({ url: makeUrl() } as Parameters<typeof load>[0]);
		const now = new Date();
		const future = archives.filter(
			(a) =>
				a.year > now.getFullYear() ||
				(a.year === now.getFullYear() && a.month > now.getMonth() + 1)
		);
		expect(future).toHaveLength(0);
	});

	it('returns archive entries in reverse chronological order', async () => {
		const { archives } = await load({ url: makeUrl() } as Parameters<typeof load>[0]);
		for (let i = 0; i < archives.length - 1; i++) {
			const current = archives[i].year * 12 + archives[i].month;
			const next = archives[i + 1].year * 12 + archives[i + 1].month;
			expect(current).toBeGreaterThan(next);
		}
	});
});
