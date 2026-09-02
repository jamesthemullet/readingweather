import { describe, expect, it } from 'vitest';
import { findRelatedPosts } from './relatedPosts';

type Candidate = { slug: string; date: string };

const post = (slug: string, date: string): Candidate => ({ slug, date });

describe('findRelatedPosts', () => {
	it('excludes the current post itself even if present in the candidates', () => {
		const current = post('today', '2026-06-15');
		const candidates = [current, post('nearby', '2026-06-16')];

		const result = findRelatedPosts(current, candidates);

		expect(result.map((p) => p.slug)).toEqual(['nearby']);
	});

	it('sorts candidates by proximity to the current post, nearest first', () => {
		const current = post('today', '2026-06-15');
		const candidates = [post('far', '2026-01-01'), post('near', '2026-06-14'), post('mid', '2026-06-01')];

		const result = findRelatedPosts(current, candidates);

		expect(result.map((p) => p.slug)).toEqual(['near', 'mid', 'far']);
	});

	it('treats posts equidistant before and after the current post as equally near', () => {
		const current = post('today', '2026-06-15');
		const candidates = [post('before', '2026-06-13'), post('after', '2026-06-17')];

		const result = findRelatedPosts(current, candidates);

		expect(result.map((p) => p.slug).sort()).toEqual(['after', 'before']);
	});

	it('defaults to returning at most 3 related posts', () => {
		const current = post('today', '2026-06-15');
		const candidates = [
			post('a', '2026-06-14'),
			post('b', '2026-06-13'),
			post('c', '2026-06-12'),
			post('d', '2026-06-11')
		];

		const result = findRelatedPosts(current, candidates);

		expect(result).toHaveLength(3);
		expect(result.map((p) => p.slug)).toEqual(['a', 'b', 'c']);
	});

	it('respects a custom limit', () => {
		const current = post('today', '2026-06-15');
		const candidates = [post('a', '2026-06-14'), post('b', '2026-06-13'), post('c', '2026-06-12')];

		const result = findRelatedPosts(current, candidates, 1);

		expect(result.map((p) => p.slug)).toEqual(['a']);
	});

	it('returns an empty array when there are no candidates', () => {
		const current = post('today', '2026-06-15');

		expect(findRelatedPosts(current, [])).toEqual([]);
	});

	it('returns an empty array when the only candidate is the current post', () => {
		const current = post('today', '2026-06-15');

		expect(findRelatedPosts(current, [current])).toEqual([]);
	});
});
