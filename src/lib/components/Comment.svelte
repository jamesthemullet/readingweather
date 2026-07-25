<script lang="ts">
	import type { Writable } from 'svelte/store';
	import { get } from 'svelte/store';
	import { sanitize } from '$lib/sanitize';
	import { showAddComment } from '$lib/stores/commentState';
	import type { ThreadedComment } from '$lib/types';
	import AddComment from './AddComment.svelte';
	import Comment from './Comment.svelte';

	type Props = {
		comment: ThreadedComment;
		postId: string;
		replyForms: Writable<Record<string, boolean>>;
	};

	const { comment, postId, replyForms }: Props = $props();

	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		};
		const formattedDate = date.toLocaleDateString('en-GB', options);

		const day = date.getDate();
		const ordinalSuffix = (day: number): 'st' | 'nd' | 'rd' | 'th' => {
			if (day > 3 && day < 21) return 'th';
			switch (day % 10) {
				case 1:
					return 'st';
				case 2:
					return 'nd';
				case 3:
					return 'rd';
				default:
					return 'th';
			}
		};

		const formattedTime = date.toLocaleTimeString('en-GB', {
			hour: 'numeric',
			minute: 'numeric',
			hour12: true
		});

		return `${formattedDate.replace(/\d+/, day + ordinalSuffix(day))} at ${formattedTime}`;
	};

	const toggleReplyForm = (commentId: string): void => {
		replyForms.update((currentForms) => ({
			[commentId]: !(currentForms[commentId] ?? false)
		}));
		showAddComment.set(!get(replyForms)[commentId]);
	};
</script>

<li class="comment">
	<small>
		By <strong>{comment.author.node.name}</strong> on <time datetime={comment.date}>{formatDate(comment.date)}</time>:
	</small>
	<p>{@html sanitize(comment.content)}</p>

	{#if comment.replies.length > 0}
		<ul class="comment-replies">
			{#each comment.replies as reply}
				<Comment comment={reply} {postId} {replyForms} />
			{/each}
		</ul>
	{/if}

	<button class="reply-button" onclick={() => toggleReplyForm(comment.id)} aria-label="Reply to {comment.author.node.name}">Reply</button>

	{#if $replyForms[comment.id]}
		<AddComment {postId} parentCommentId={comment.id} />
	{/if}
</li>
