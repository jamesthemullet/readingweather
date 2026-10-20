import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AddComment from './AddComment.svelte';

const postId = 'post-1';

async function fillAndSubmit(): Promise<void> {
	await fireEvent.input(screen.getByLabelText('Name:'), { target: { value: 'Jane Doe' } });
	await fireEvent.input(screen.getByLabelText('Email:'), { target: { value: 'jane@example.com' } });
	await fireEvent.input(screen.getByLabelText('Comment:'), { target: { value: 'Great forecast!' } });
	await fireEvent.click(screen.getByRole('button', { name: 'Post Comment' }));
}

describe('AddComment', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('renders the top-level heading and posts the comment without a parentCommentId', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ success: true })
		} as Response);

		render(AddComment, { props: { postId } });

		expect(screen.getByText('Add Your Comment')).toBeTruthy();

		await fillAndSubmit();

		expect(fetch).toHaveBeenCalledWith('/api/comment', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				postId,
				content: 'Great forecast!',
				name: 'Jane Doe',
				email: 'jane@example.com',
				parentCommentId: null
			})
		});
	});

	it('renders the reply heading and includes parentCommentId when replying', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ success: true })
		} as Response);

		render(AddComment, { props: { postId, parentCommentId: 'comment-5' } });

		expect(screen.getByText('Reply to Comment')).toBeTruthy();

		await fillAndSubmit();

		expect(fetch).toHaveBeenCalledWith(
			'/api/comment',
			expect.objectContaining({
				body: JSON.stringify({
					postId,
					content: 'Great forecast!',
					name: 'Jane Doe',
					email: 'jane@example.com',
					parentCommentId: 'comment-5'
				})
			})
		);
	});

	it('shows a success message and clears the form on a successful submission', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ success: true })
		} as Response);

		render(AddComment, { props: { postId } });

		await fillAndSubmit();

		expect(
			await screen.findByText('Thanks! Your comment has been submitted and is awaiting approval.')
		).toBeTruthy();
		expect(screen.queryByLabelText('Name:')).toBeNull();
	});

	it('shows the server-provided error message when the API reports failure', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ success: false, message: 'Comment content is required.' })
		} as Response);

		render(AddComment, { props: { postId } });

		await fillAndSubmit();

		expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Comment content is required.');
		expect(screen.getByLabelText('Name:')).toBeTruthy();
	});

	it('shows a fallback error message when the fetch call throws', async () => {
		vi.mocked(fetch).mockRejectedValue(new Error('network down'));

		render(AddComment, { props: { postId } });

		await fillAndSubmit();

		expect(await screen.findByRole('alert')).toHaveProperty(
			'textContent',
			'Error submitting comment. Please try again.'
		);
	});

	it('disables the submit button while the request is in flight', async () => {
		let resolveFetch: (value: Response) => void = () => {};
		vi.mocked(fetch).mockReturnValue(
			new Promise((resolve) => {
				resolveFetch = resolve;
			})
		);

		render(AddComment, { props: { postId } });

		await fireEvent.input(screen.getByLabelText('Name:'), { target: { value: 'Jane Doe' } });
		await fireEvent.input(screen.getByLabelText('Email:'), { target: { value: 'jane@example.com' } });
		await fireEvent.input(screen.getByLabelText('Comment:'), { target: { value: 'Great forecast!' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Post Comment' }));

		expect(screen.getByRole('button', { name: 'Submitting...' })).toHaveProperty('disabled', true);

		resolveFetch({ ok: true, json: () => Promise.resolve({ success: true }) } as Response);
		await screen.findByText('Thanks! Your comment has been submitted and is awaiting approval.');
	});
});
