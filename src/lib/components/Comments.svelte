<script lang="ts">
	import AddComment from './AddComment.svelte';

	let { threadedComments, postId } = $props();

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

	let showReplyForm = $state(false);
	const toggleReplyForm = () => {
		showReplyForm = !showReplyForm;
	};
</script>

<section class="comments-block">
	<h2>Any comments?</h2>
	{#if threadedComments.length > 0}
		<ul class="comments-list">
			{#each threadedComments as comment}
				<li class="comment">
					<p>
						By <strong>{comment.author.node.name}</strong> on {formatDate(comment.date)}:
					</p>
					<p>{@html comment.content}</p>

					{#if comment.replies.length > 0}
						<ul class="comment-replies">
							{#each comment.replies as reply}
								<li class="comment-reply">
									<p>
										By <strong>{comment.author.node.name}</strong> on {formatDate(comment.date)}:
									</p>
									<p>{@html reply.content}</p>
								</li>
							{/each}
						</ul>
					{/if}

					<button on:click={toggleReplyForm}>Reply</button>

					{#if showReplyForm}
						<AddComment {postId} parentCommentId={comment.id} />
					{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p>No comments yet. Be the first to comment!</p>
	{/if}
</section>
