<script lang="ts">
	import { sanitize } from '$lib/sanitize';
	import type { AllPostsNode } from '$lib/types';

	type Props = {
		posts: AllPostsNode[];
	};

	const { posts }: Props = $props();

	export let preview = false;

	const modifyContent = (content: string): string => {
		const paragraphs = content.split(/<\/?p>/).filter((p) => p.trim() !== '');

		const iframeHTML = `<iframe id='kofiframe' src='https://ko-fi.com/wffrb/?hidefeed=true&widget=true&embed=true&preview=true' style='border:none;width:100%;padding:4px;background:#f9f9f9;' height='612' title='Support Reading Weather on Ko-fi'></iframe>`;
		if (paragraphs.length > 2) {
			paragraphs.splice(-3, 0, iframeHTML);
		}

		return paragraphs.map((p) => `<p>${p}</p>`).join('');
	};

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
					<div class="content">{@html sanitize(modifyContent(post.content))}</div>
					<div class="comment-link">
						<a href="/{post.slug}#comments" aria-label="View or add a comment on {post.title}">View or add a comment</a>
					</div>
				{/if}
			</article>
		</li>
	{/each}
</ul>
