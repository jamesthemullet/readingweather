<script lang="ts">
	import { tick } from 'svelte';
	import { showAddComment } from '$lib/stores/commentState';

	type Props = {
		postId: string;
		parentCommentId?: string | null;
	};

	const { postId, parentCommentId = null }: Props = $props();

	const fieldPrefix = $derived(
		`${postId.replace(/[^a-zA-Z0-9]/g, '')}${parentCommentId ? `-${parentCommentId.replace(/[^a-zA-Z0-9]/g, '')}` : ''}`
	);
	const formHeadingId = $derived(`comment-form-heading-${fieldPrefix}`);

	let name = $state('');
	let email = $state('');
	let commentContent = $state('');
	let submitting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	async function submitComment(event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }): Promise<void> {
		event.preventDefault();
		const form = event.currentTarget;
		submitting = true;
		errorMessage = '';
		successMessage = '';

		try {
			const res = await fetch('/api/comment', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ postId, content: commentContent, name, email, parentCommentId })
			});

			const data = (await res.json()) as { success?: boolean; message?: string };

			if (res.ok && data.success) {
				successMessage = 'Thanks! Your comment has been submitted and is awaiting approval.';
				name = '';
				email = '';
				commentContent = '';
				await tick();
				form.reset();
			} else {
				errorMessage = data.message ?? 'Failed to submit comment.';
			}
		} catch {
			errorMessage = 'Error submitting comment. Please try again.';
		}

		showAddComment.set(true);
		submitting = false;
	}
</script>

<form class="add-comment" aria-labelledby={formHeadingId} onsubmit={submitComment}>
	<h2 id={formHeadingId}>{parentCommentId ? 'Reply to Comment' : 'Add Your Comment'}</h2>
	{#if !successMessage}
		<div>
			<label for="name-{fieldPrefix}">Name:</label>
			<input type="text" bind:value={name} id="name-{fieldPrefix}" name="name" autocomplete="name" required aria-required="true" />
		</div>
		<div>
			<label for="email-{fieldPrefix}">Email:</label>
			<input type="email" bind:value={email} id="email-{fieldPrefix}" name="email" autocomplete="email" required aria-required="true" />
		</div>
		<div>
			<label for="comment-{fieldPrefix}">Comment:</label>
			<textarea bind:value={commentContent} id="comment-{fieldPrefix}" name="comment" autocomplete="off" required aria-required="true"></textarea>
		</div>
		<button type="submit" disabled={submitting}>
			{submitting ? 'Submitting...' : 'Post Comment'}
		</button>
	{/if}
	<p role="alert" aria-live="assertive" class="form-message form-message--error">{errorMessage}</p>
	<p role="status" aria-live="polite" class="form-message form-message--success">{successMessage}</p>
</form>
