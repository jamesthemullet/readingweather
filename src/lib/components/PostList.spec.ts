import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import type { AllPostsNode } from '$lib/types';
import PostList from './PostList.svelte';

function makePost(overrides: Partial<AllPostsNode> = {}): AllPostsNode {
	return {
		date: '2026-09-01T10:00:00.000Z',
		slug: 'sunday-forecast',
		title: 'Sunday Forecast',
		content: '<p>First paragraph.</p><p>Second paragraph.</p>',
		...overrides
	};
}

describe('PostList', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders a list item with heading and link for each post', () => {
		const posts = [makePost({ slug: 'post-one', title: 'Post One' }), makePost({ slug: 'post-two', title: 'Post Two' })];

		render(PostList, { props: { posts } });

		const list = screen.getByRole('list');
		expect(list.querySelectorAll(':scope > li')).toHaveLength(2);
		expect(screen.getByRole('heading', { name: 'Post One' })).toBeTruthy();
		expect(screen.getByRole('heading', { name: 'Post Two' })).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Post One' })).toHaveProperty('href', expect.stringContaining('/post-one'));
	});

	it('shows only the first paragraph and a "read more" link in preview mode', () => {
		const posts = [makePost()];

		render(PostList, { props: { posts, preview: true } });

		expect(screen.getByText('First paragraph.')).toBeTruthy();
		expect(screen.queryByText('Second paragraph.')).toBeNull();
		expect(screen.getByRole('link', { name: 'Read full forecast: Sunday Forecast' })).toBeTruthy();
		expect(screen.queryByRole('link', { name: /View or add a comment/ })).toBeNull();
	});

	it('shows the full content and a comment link outside of preview mode', () => {
		const posts = [makePost()];

		render(PostList, { props: { posts } });

		expect(screen.getByText('First paragraph.')).toBeTruthy();
		expect(screen.getByText('Second paragraph.')).toBeTruthy();
		expect(screen.getByRole('link', { name: 'View or add a comment on Sunday Forecast' })).toBeTruthy();
		expect(screen.queryByRole('link', { name: /Read full forecast/ })).toBeNull();
	});

	it('gives the first post an eager, high-priority image and later posts a lazy one', () => {
		const posts = [
			makePost({
				slug: 'first-post',
				title: 'First Post',
				featuredImage: { node: { sourceUrl: 'https://example.com/first.jpg', srcSet: '', altText: 'First' } }
			}),
			makePost({
				slug: 'second-post',
				title: 'Second Post',
				featuredImage: { node: { sourceUrl: 'https://example.com/second.jpg', srcSet: '', altText: 'Second' } }
			})
		];

		render(PostList, { props: { posts } });

		const firstImage = screen.getByAltText('First');
		const secondImage = screen.getByAltText('Second');

		expect(firstImage).toHaveProperty('loading', 'eager');
		expect(firstImage.getAttribute('fetchpriority')).toBe('high');
		expect(secondImage).toHaveProperty('loading', 'lazy');
		expect(secondImage.getAttribute('fetchpriority')).toBeNull();
	});

	it('renders no image when a post has no featured image', () => {
		const posts = [makePost()];

		render(PostList, { props: { posts } });

		expect(screen.queryByRole('img')).toBeNull();
	});
});
