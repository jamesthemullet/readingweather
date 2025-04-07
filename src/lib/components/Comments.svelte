<script lang="ts">
	import { writable } from 'svelte/store';
	import Comment from './Comment.svelte';

	const { threadedComments, postId } = $props();

	const replyForms = writable<{ [key: string]: boolean }>({});
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
