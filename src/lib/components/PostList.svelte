<script lang="ts">


	type Post = {
		slug: string;
		title: string;
		content: string;
		featuredImage?: {
			node?: {
				sourceUrl: string;
				srcSet: string;
				mediaDetails?: {
					width?: number;
					height?: number;
				};
			};
		};
	};

	const { posts, preview = false }: { posts: Post[]; preview?: boolean } = $props();

	const firstParagraph = (content: string): string => {
		const first = content.split(/<\/?p>/).find((p) => p.trim() !== '');
		return first ? `<p>${first}</p>` : '';
	};
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
							sizes="(min-width: 768px) 700px, 100vw"
							alt=""
							width={post.featuredImage.node.mediaDetails?.width ?? undefined}
							height={post.featuredImage.node.mediaDetails?.height ?? undefined}
							loading="lazy"
						/>
					{/if}
					<h2>{post.title}</h2>
				</a>
			{#if preview}
					<div class="content">{@html sanitize(firstParagraph(post.content))}</div>
					<a href="/{post.slug}" class="read-more">Read full forecast</a>
				{:else}
					<div class="content">{@html sanitize(injectKofiWidget(post.content))}</div>
					<div class="comment-link">
						<a href="/{post.slug}#comments" aria-label="View or add a comment on {post.title}">View or add a comment</a>
					</div>
				{/if}
			</article>
		</li>
	{/each}
</ul>
