<script lang="ts">
	const { postUrl, postTitle }: { postUrl: string; postTitle: string } = $props();

	let copied = $state(false);

	function copyLink() {
		navigator.clipboard.writeText(postUrl).then(() => {
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		});
	}

	function shareOnX() {
		const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postTitle)}&url=${encodeURIComponent(postUrl)}`;
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	function shareOnWhatsApp() {
		const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${postTitle} ${postUrl}`)}`;
		window.open(url, '_blank', 'noopener,noreferrer');
	}
</script>

<div class="share">
	<p class="share-label">Found this forecast useful?</p>
	<div class="share-buttons">
		<button onclick={copyLink} aria-label="Copy link to this forecast">
			{copied ? 'Copied!' : 'Copy link'}
		</button>
		<button onclick={shareOnX} aria-label="Share this forecast on X">Share on X</button>
		<button onclick={shareOnWhatsApp} aria-label="Share this forecast on WhatsApp">
			Share on WhatsApp
		</button>
	</div>
</div>

<style>
	.share {
		margin: 2rem 0 1rem;
		padding: 1rem;
		border-top: 2px solid var(--nav);
		border-bottom: 2px solid var(--nav);
	}

	.share-label {
		margin: 0 0 0.75rem;
		font-family: var(--heading-font);
		font-size: 1.25rem;
		color: var(--nav);
	}

	.share-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	button {
		font-size: 1rem;
	}
</style>
