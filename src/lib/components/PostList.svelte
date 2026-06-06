<script lang="ts">
	import { sanitize } from '$lib/sanitize';
	import { injectKofiWidget } from '$lib/kofi';

	export let posts: Array<{
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
							sizes="(min-width: 768px) 700px, 100vw"
							alt={post.title}
							width={post.featuredImage.node.mediaDetails?.width ?? undefined}
							height={post.featuredImage.node.mediaDetails?.height ?? undefined}
							loading="lazy"
						/>
					{/if}
					<h2>{post.title}</h2>
				</a>
				<div class="content">{@html sanitize(injectKofiWidget(post.content))}</div>
				<div class="comment-link">
					<a href="/{post.slug}#comments" aria-label="View or add a comment on {post.title}">View or add a comment</a>
				</div>
			</article>
		</li>
	{/each}
</ul>
