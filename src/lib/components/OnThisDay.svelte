<script lang="ts">
	export let posts: Array<{
		title: string;
		slug: string;
		date: string;
	}>;

	const currentYear = new Date().getFullYear();

	const historicalPosts = posts.filter((post) => new Date(post.date).getFullYear() < currentYear);

	const getYear = (dateString: string): string => String(new Date(dateString).getFullYear());
</script>

{#if historicalPosts.length > 0}
	<article class="post on-this-day">
		<h2>On This Day in Reading Weather</h2>
		<div class="content">
			<p>Here's what the weather was like in Reading on this date in previous years:</p>
			<ul class="on-this-day-list">
				{#each historicalPosts as post}
					<li>
						<span class="year">{getYear(post.date)}</span>
						<a href="/{post.slug}">{post.title}</a>
					</li>
				{/each}
			</ul>
		</div>
	</article>
{/if}

<style>
	.on-this-day-list {
		list-style: none;
		padding: 0 2rem;
	}

	.on-this-day-list li {
		display: flex;
		gap: 1rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid #eee;
		align-items: baseline;
	}

	.on-this-day-list li:last-child {
		border-bottom: none;
	}

	.year {
		font-family: var(--heading-font);
		font-size: 1.5rem;
		color: var(--nav);
		min-width: 4rem;
		font-weight: bold;
	}
</style>
