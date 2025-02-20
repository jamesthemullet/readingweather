<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>Weather Forecast For Reading & Berkshire</h1>

<ul>
	{#each data.posts.nodes as post}
		<li>
			<a href="/blog/{post.slug}">
				{post.title}
			</a>
		</li>
	{/each}
</ul>
