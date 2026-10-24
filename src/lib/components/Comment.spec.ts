import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { afterEach, describe, expect, it } from 'vitest';
import type { ThreadedComment } from '$lib/types';
import Comment from './Comment.svelte';

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

describe('Comment', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders the author, formatted date and sanitized content', () => {
		const comment = makeComment();
		const replyForms = writable<Record<string, boolean>>({});

		render(Comment, { props: { comment, postId, replyForms } });

		expect(screen.getByText('Jane Doe')).toBeTruthy();
		expect(screen.getByText('1st September 2026 at 10:00 am')).toBeTruthy();
		expect(screen.getByText('Lovely forecast today!')).toBeTruthy();
	});

	it('renders nested replies recursively', () => {
		const comment = makeComment({
			id: 'comment-1',
			author: { node: { name: 'Jane Doe' } },
			replies: [
				makeComment({ id: 'reply-1', parentId: 'comment-1', author: { node: { name: 'Reply Guy' } } })
			]
		});
		const replyForms = writable<Record<string, boolean>>({});

		render(Comment, { props: { comment, postId, replyForms } });

		expect(screen.getByText('Jane Doe')).toBeTruthy();
		expect(screen.getByText('Reply Guy')).toBeTruthy();
	});

	it('does not render a reply list when there are no replies', () => {
		const comment = makeComment();
		const replyForms = writable<Record<string, boolean>>({});

		render(Comment, { props: { comment, postId, replyForms } });

		expect(screen.queryByRole('list')).toBeNull();
	});

	it('toggles the reply form when the reply button is clicked', async () => {
		const comment = makeComment();
		const replyForms = writable<Record<string, boolean>>({});

		render(Comment, { props: { comment, postId, replyForms } });

		expect(screen.queryByText('Reply to Comment')).toBeNull();

		await fireEvent.click(screen.getByRole('button', { name: 'Reply to Jane Doe' }));
		expect(screen.getByText('Reply to Comment')).toBeTruthy();

		await fireEvent.click(screen.getByRole('button', { name: 'Reply to Jane Doe' }));
		expect(screen.queryByText('Reply to Comment')).toBeNull();
	});
});
