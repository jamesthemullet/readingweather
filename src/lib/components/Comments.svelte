<script lang="ts">
	import Comment from './Comment.svelte'; // Import the recursive component
	import { writable } from 'svelte/store';

	let { threadedComments, postId } = $props();

	const replyForms = writable<{ [key: string]: boolean }>({}); // Using writable store for reactivity

	const toggleReplyForm = (commentId: string) => {
		replyForms.update((currentForms) => ({
			...currentForms,
			[commentId]: !currentForms[commentId]
		}));
	};
</script>

<section id="comments" class="comments-block">
	<h2>Any comments?</h2>
	{#if threadedComments.length > 0}
		<ul class="comments-list">
			{#each threadedComments as comment}
				<Comment {comment} {postId} {replyForms} />
			{/each}
		</ul>
	{:else}
		<p>No comments yet. Be the first to comment!</p>
	{/if}
</section>
