<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../styles/global.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Analytics from '$lib/analytics/analytics.svelte';
	import NavBar from '$lib/components/NavBar.svelte';

	// biome-ignore lint/style/useConst: <cannot bind to a const>
	let name = $state('');
	// biome-ignore lint/style/useConst: <cannot bind to a const>
	let email = $state('');
	let responseMessage = $state('');

	const handleSubmit = async (e: Event) => {
		e.preventDefault();

		try {
			const res = await fetch('/api/subscribe', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name, email })
			});

			const data = await res.json();
			responseMessage = data.message;
		} catch {
			responseMessage = 'Something went wrong.';
		}
	};

	onMount(async () => {
		if (import.meta.env.MODE === 'development') {
			const { accented } = await import('accented');
			accented();
		}
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://blog.readingweather.co.uk" />
	<link rel="preconnect" href="https://www.googletagmanager.com" />
	<link rel="preload" href="/fonts/Caveat-VariableFont_wght.ttf" as="font" type="font/ttf" crossorigin="anonymous" />
	<link rel="preload" href="/fonts/FiraSans-Regular.ttf" as="font" type="font/ttf" crossorigin="anonymous" />
	<link rel="canonical" href={$page.url.href} />
	<meta property="og:site_name" content="Reading Weather" />
	<meta property="og:locale" content="en_GB" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<Analytics />
<a href="#main" class="skip-link">Skip to main content</a>
<NavBar />
<main id="main">
	<slot />
</main>

<footer>
	<article class="post">
		<h2>Be notified of new posts by e-mail</h2>
		<p>
			Please note that this feature is experimental - if you sign up you may also receive multiple
			test messages until I'm satisfied it is working!
		</p>
		<form id="subscribe-form" onsubmit={handleSubmit}>
			<label>
				Name:
				<input autocomplete="name" type="text" bind:value={name} required />
			</label>
			<label>
				Email:
				<input autocomplete="email" type="email" bind:value={email} required />
			</label>
			<button type="submit">Subscribe</button>
		</form>

		<p class="response" role="status" aria-live="polite">{responseMessage}</p>
	</article>
	<p>&copy; {new Date().getFullYear()} Weather Forecast For Reading & Berkshire</p>
</footer>
