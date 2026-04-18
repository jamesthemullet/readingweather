<script lang="ts">
	import { tick } from 'svelte';
	import { showAddComment } from '$lib/stores/commentState';

	const { postId, parentCommentId = null } = $props();

	let name = $state('');
	let email = $state('');
	let commentContent = $state('');
	let submitting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	async function submitComment(event: Event) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		submitting = true;
		errorMessage = '';
		successMessage = '';

		try {
			const res = await fetch('/api/comment', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ postId, content: commentContent, name, email, parentCommentId })
			});

			const data = await res.json();

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

<form class="add-comment" onsubmit={submitComment}>
	<h2>{parentCommentId ? 'Reply to Comment' : 'Add Your Comment'}</h2>
	{#if !successMessage}
		<div>
			<label for="name">Name:</label>
			<input type="text" bind:value={name} id="name" name="name" autocomplete="name" required />
		</div>
		<div>
			<label for="email">Email:</label>
			<input type="email" bind:value={email} id="email" name="email" autocomplete="email" required />
		</div>
		<div>
			<label for="comment">Comment:</label>
			<textarea bind:value={commentContent} id="comment" name="comment" autocomplete="off" required></textarea>
		</div>
		<button type="submit" disabled={submitting}>
			{submitting ? 'Submitting...' : 'Post Comment'}
		</button>
	{/if}
	<p role="alert" aria-live="assertive" style="color: red;">{errorMessage}</p>
	<p role="status" aria-live="polite" style="color: green;">{successMessage}</p>
</form>
