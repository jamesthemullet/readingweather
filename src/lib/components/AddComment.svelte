<script lang="ts">
	import { addComment } from '$lib/graphql/api';
	import { showAddComment } from '$lib/stores/commentState';
	import { tick } from 'svelte';

	let { postId, parentCommentId = null } = $props();

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

		const decodedId = atob(postId).split(':')[1];
		const decodedPostId = Number.parseInt(decodedId, 10);

		try {
			const newComment = await addComment(
				decodedPostId,
				commentContent,
				name,
				email,
				parentCommentId
			);
			if (newComment.success) {
				successMessage = 'Thanks!  Your comment has been submitted and is awaiting approval.';

				name = '';
				email = '';
				commentContent = '';

				await tick();

				form.reset();
			} else {
				errorMessage = 'Failed to submit comment.';
			}
		} catch (error) {
			errorMessage = 'Error submitting comment.';
			console.error(error);
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
			<input type="text" bind:value={name} id="name" name="name" required />
		</div>
		<div>
			<label for="email">Email:</label>
			<input type="email" bind:value={email} id="email" name="email" required />
		</div>
		<div>
			<label for="comment">Comment:</label>
			<textarea bind:value={commentContent} id="comment" name="comment" required></textarea>
		</div>
		<button type="submit" disabled={submitting}>
			{submitting ? 'Submitting...' : 'Post Comment'}
		</button>
	{/if}
	{#if errorMessage}
		<p style="color: red;">{errorMessage}</p>
	{/if}
	{#if successMessage}
		<p style="color: green;">{successMessage}</p>
	{/if}
</form>
