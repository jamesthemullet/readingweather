<script lang="ts">
	type Props = {
		postUrl: string;
		postTitle: string;
		postSummary: string;
	};

	const { postUrl, postTitle, postSummary }: Props = $props();

	let copied = $state(false);

	function copyLink(): void {
		navigator.clipboard.writeText(postUrl).then(() => {
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		});
	}

	function shareOnBluesky(): void {
		const url = `https://bsky.app/intent/compose?text=${encodeURIComponent(`${postSummary} ${postUrl}`)}`;
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	function shareOnThreads(): void {
		const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(`${postSummary} ${postUrl}`)}`;
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	function shareOnFacebook(): void {
		const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	function shareOnWhatsApp(): void {
		const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${postSummary} ${postUrl}`)}`;
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
