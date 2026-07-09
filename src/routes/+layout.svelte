<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../styles/global.css';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Analytics from '$lib/analytics/analytics.svelte';
	import NavBar from '$lib/components/NavBar.svelte';

	const { children }: { children: Snippet } = $props();

	let name = $state('');
	let email = $state('');
	let responseMessage = $state('');

	const handleSubmit = async (e: Event): Promise<void> => {
		e.preventDefault();

		try {
			const res = await fetch('/api/subscribe', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name, email })
			});

			const data = (await res.json()) as { message?: string };
			responseMessage = data.message ?? '';
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
	{@render children()}
</main>

<footer>
	<section class="post">
		<h2 id="subscribe-heading">Be notified of new posts by e-mail</h2>
<form id="subscribe-form" aria-labelledby="subscribe-heading" onsubmit={handleSubmit}>
			<label for="subscribe-name">
				Name:
				<input id="subscribe-name" autocomplete="name" type="text" bind:value={name} required aria-required="true" />
			</label>
			<label for="subscribe-email">
				Email:
				<input id="subscribe-email" autocomplete="email" type="email" bind:value={email} required aria-required="true" />
			</label>
			<button type="submit">Subscribe</button>
		</form>

		<p class="response" role="status" aria-live="polite">{responseMessage}</p>
	</section>
	<p>&copy; {new Date().getFullYear()} Weather Forecast For Reading & Berkshire</p>
</footer>
