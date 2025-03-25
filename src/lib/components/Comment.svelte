<script lang="ts">
	import AddComment from './AddComment.svelte';
	import { writable } from 'svelte/store';
	import Comment from './Comment.svelte';

	let { comment, postId, replyForms } = $props();

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		};
		const formattedDate = date.toLocaleDateString('en-US', options);

		// Add ordinal suffix to the day
		const day = date.getDate();
		const ordinalSuffix = (day: number) => {
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

		const formattedTime = date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: 'numeric',
			hour12: true
		});

		return `${formattedDate.replace(/\d+/, day + ordinalSuffix(day))} at ${formattedTime}`;
	};

	const toggleReplyForm = (commentId: string) => {
		replyForms.update((currentForms) => ({
			...currentForms,
			[commentId]: !currentForms[commentId]
		}));
	};
</script>

<li class="comment">
	<p>
		By <strong>{comment?.author.node.name}</strong> on {formatDate(comment?.date)}:
	</p>
	<p>{@html comment?.content}</p>

	{#if comment?.replies.length > 0}
		<ul class="comment-replies">
			{#each comment.replies as reply}
				<Comment comment={reply} {postId} {replyForms} />
			{/each}
		</ul>
	{/if}

	<!-- Button to reply to this comment -->
	<button on:click={() => toggleReplyForm(comment?.id)}>Reply</button>

	{#if $replyForms[comment?.id]}
		<AddComment {postId} parentCommentId={comment.id} />
	{/if}
</li>
