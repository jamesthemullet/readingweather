<script lang="ts">
	import { injectKofiWidget } from '$lib/kofi';
	import { sanitize } from '$lib/sanitize';
	import type { AllPostsNode } from '$lib/types';

	type Props = {
		posts: AllPostsNode[];
		preview?: boolean;
	};

	const { posts, preview = false }: Props = $props();

	const firstParagraph = (content: string): string => {
		const first = content.split(/<\/?p>/).find((p) => p.trim() !== '');
		return first ? `<p>${first}</p>` : '';
	};
</script>

<ul>
	{#each posts as post, i}
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
							loading={i === 0 ? 'eager' : 'lazy'}
							fetchpriority={i === 0 ? 'high' : undefined}
							decoding={i === 0 ? undefined : 'async'}
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
