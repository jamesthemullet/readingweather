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

	function shareOnBluesky() {
		const url = `https://bsky.app/intent/compose?text=${encodeURIComponent(`${postTitle} ${postUrl}`)}`;
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	function shareOnThreads() {
		const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(`${postTitle} ${postUrl}`)}`;
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	function shareOnFacebook() {
		const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
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
		<button onclick={shareOnBluesky} aria-label="Share this forecast on Bluesky">
			Share on Bluesky
		</button>
		<button onclick={shareOnThreads} aria-label="Share this forecast on Threads">
			Share on Threads
		</button>
		<button onclick={shareOnFacebook} aria-label="Share this forecast on Facebook">
			Share on Facebook
		</button>
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
		text-align: center;
	}

	.share-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		justify-content: center;
	}

	button {
		font-size: 1rem;
	}
</style>
