<!-- src/routes/+layout.svelte -->
<script>
	import '../styles/global.css';
	import Analytics from '$lib/analytics/analytics.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
</script>

<Analytics />
<NavBar />
<main>
	<slot />
</main>

<footer>
	<p>&copy; {new Date().getFullYear()} Weather Forecast For Reading & Berkshire</p>
</footer>
