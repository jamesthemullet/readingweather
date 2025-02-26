<!-- src/routes/+layout.svelte -->
<script>
	import '../styles/global.css';
	import NavBar from '$lib/components/NavBar.svelte';
</script>

<NavBar />
<main>
	<slot />
</main>

<footer>
	<p>&copy; {new Date().getFullYear()} Weather Forecast For Reading & Berkshire</p>
</footer>
