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

	const modifyContent = (content: string) => {
		const paragraphs = content.split(/<\/?p>/).filter((p) => p.trim() !== '');

		const iframeHTML = `<iframe id='kofiframe' src='https://ko-fi.com/wffrb/?hidefeed=true&widget=true&embed=true&preview=true' style='border:none;width:100%;padding:4px;background:#f9f9f9;' height='612' title='wffrb'></iframe>`;
		if (paragraphs.length > 2) {
			paragraphs.splice(-3, 0, iframeHTML);
		}

		return paragraphs.map((p) => `<p>${p}</p>`).join('');
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
							alt={'Photograph of recent weather in/around Reading'}
							width="200"
							height="auto"
						/>
					{/if}
					<h2>{post.title}</h2>
				</a>
				<div class="content">{@html modifyContent(post.content)}</div>
				<div class="comment-link">
					<a href="/{post.slug}#comments">View or add a comment</a>
				</div>
			</article>
		</li>
	{/each}
</ul>
