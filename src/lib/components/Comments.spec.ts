import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import type { ThreadedComment } from '$lib/types';
import Comments from './Comments.svelte';

const postId = 'post-1';

function makeComment(overrides: Partial<ThreadedComment> = {}): ThreadedComment {
	return {
		id: 'comment-1',
		content: '<p>Lovely forecast today!</p>',
		parentId: null,
		author: { node: { name: 'Jane Doe' } },
		date: '2026-09-01T10:00:00.000Z',
		replies: [],
		...overrides
	};
}

describe('Comments', () => {
	afterEach(() => {
		cleanup();
	});

	it('shows an empty state when there are no comments', () => {
		render(Comments, { props: { threadedComments: [], postId } });

		expect(screen.getByText('No comments yet. Be the first to comment!')).toBeTruthy();
		expect(screen.queryByRole('list')).toBeNull();
	});

	it('renders a list item for each top-level comment', () => {
		const threadedComments = [
			makeComment({ id: 'comment-1', author: { node: { name: 'Jane Doe' } } }),
			makeComment({ id: 'comment-2', author: { node: { name: 'John Smith' } } })
		];

		render(Comments, { props: { threadedComments, postId } });

		expect(screen.queryByText('No comments yet. Be the first to comment!')).toBeNull();
		const list = screen.getByRole('list');
		expect(list.querySelectorAll(':scope > li.comment')).toHaveLength(2);
		expect(screen.getByText('Jane Doe')).toBeTruthy();
		expect(screen.getByText('John Smith')).toBeTruthy();
	});

	it('renders nested replies for a threaded comment', () => {
		const threadedComments = [
			makeComment({
				id: 'comment-1',
				author: { node: { name: 'Jane Doe' } },
				replies: [
					makeComment({ id: 'reply-1', parentId: 'comment-1', author: { node: { name: 'Reply Guy' } } })
				]
			})
		];

		render(Comments, { props: { threadedComments, postId } });

		expect(screen.getByText('Jane Doe')).toBeTruthy();
		expect(screen.getByText('Reply Guy')).toBeTruthy();
	});
});
