<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>Welcome to SvelteKit</h1>
<p>
	Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation
</p>

<ul>
	{#each data.posts.nodes as post}
		<li>
			<a href="/blog/{post.slug}">
				{post.title}
			</a>
		</li>
	{/each}
</ul>
