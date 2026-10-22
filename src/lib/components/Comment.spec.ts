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

	it("renders the author's name, formatted date, and sanitized content", () => {
		const comment = makeComment();

		render(Comment, { props: { comment, postId, replyForms: writable({}) } });

		expect(screen.getByText('Jane Doe')).toBeTruthy();
		expect(screen.getByText('1st September 2026 at 10:00 am')).toBeTruthy();
		expect(screen.getByText('Lovely forecast today!')).toBeTruthy();
	});

	it('renders nested replies recursively', () => {
		const comment = makeComment({
			id: 'comment-1',
			replies: [
				makeComment({
					id: 'reply-1',
					parentId: 'comment-1',
					author: { node: { name: 'Reply Guy' } },
					content: '<p>Thanks!</p>'
				})
			]
		});

		render(Comment, { props: { comment, postId, replyForms: writable({}) } });

		const nestedList = screen.getByRole('list');
		expect(nestedList.querySelectorAll(':scope > li.comment')).toHaveLength(1);
		expect(screen.getByText('Reply Guy')).toBeTruthy();
	});

	it('shows the reply form for this comment when its reply button is clicked', async () => {
		const comment = makeComment();
		const replyForms = writable<Record<string, boolean>>({});

		render(Comment, { props: { comment, postId, replyForms } });

		expect(screen.queryByText('Reply to Comment')).toBeNull();

		await fireEvent.click(screen.getByRole('button', { name: 'Reply to Jane Doe' }));

		expect(screen.getByText('Reply to Comment')).toBeTruthy();
	});
});
