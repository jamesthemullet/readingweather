<script lang="ts">
	export let posts: Array<{
		slug: string;
		title: string;
		content: string;
		featuredImage?: {
			node?: {
				sourceUrl: string;
				srcSet: string;
			};
		};
	}>;
</script>

<ul>
	{#each posts as post}
		<li>
			<article class="post">
				<a href="/{post.slug}">
					{#if post.featuredImage?.node?.sourceUrl}
						<img
							src={post.featuredImage.node.sourceUrl}
							srcset={post.featuredImage.node.srcSet}
							alt={'Photograph of recent weather in/around Reading'}
							width="200"
							loading="lazy"
						/>
					{/if}
					<h2>{post.title}</h2>
				</a>
				<div class="content">{@html post.content}</div>
				<div class="comment-link">
					<a href="/{post.slug}#comments">View or add a comment</a>
				</div>
			</article>
		</li>
	{/each}
</ul>
