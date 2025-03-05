<script lang="ts">
	export let posts;
</script>

<ul>
	{#each posts as post}
		<li class="post">
			<a href="/blog/{post.slug}">
				{#if post.featuredImage?.node?.sourceUrl}
					<img
						src={post.featuredImage.node.sourceUrl}
						srcset={post.featuredImage.node.srcSet}
						alt={post.title}
						width="200"
						height="auto"
					/>
				{/if}
				<h2>{post.title}</h2>
			</a>
		</li>
		<div class="content">{@html post.content}</div>
	{/each}
</ul>
