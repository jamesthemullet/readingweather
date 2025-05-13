<script lang="ts">
	import { afterNavigate } from '$app/navigation';

	afterNavigate(() => {
		if (typeof window.gtag === 'function') {
			window.gtag('config', 'G-DDSBCZJ83W', {
				page_path: window.location.pathname,
				page_title: document.title
			});
		}
	});
</script>

<svelte:head>
	<script async src="https://www.googletagmanager.com/gtag/js?id=G-DDSBCZJ83W"></script>
	<script>
		window.dataLayer = window.dataLayer || [];
		function gtag() {
			window.dataLayer.push(arguments);
		}
		window.gtag = gtag;

		gtag('js', new Date());
		gtag('config', 'G-DDSBCZJ83W'); // Initial page load
	</script>
</svelte:head>
