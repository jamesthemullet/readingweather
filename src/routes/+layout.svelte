<!-- src/routes/+layout.svelte -->
<script>
	import '../styles/global.css';
	import NavBar from '$lib/components/NavBar.svelte';
	import Analytics from '$lib/analytics/analytics.svelte';
</script>

<Analytics />
<NavBar />
<main>
	<slot />
</main>

<footer>
	<p>&copy; {new Date().getFullYear()} Weather Forecast For Reading & Berkshire</p>
</footer>
