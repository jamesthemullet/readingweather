<script lang="ts">
	import { writable } from 'svelte/store';
	import type { ThreadedComment } from '$lib/types';
	import Comment from './Comment.svelte';

	interface Props {
		threadedComments: ThreadedComment[];
		postId: string;
	}

	const { threadedComments, postId }: Props = $props();

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
