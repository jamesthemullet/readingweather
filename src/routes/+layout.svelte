<!-- src/routes/+layout.svelte -->
<script>
	import '../styles/global.css';
	import NavBar from '$lib/components/NavBar.svelte';
</script>

<NavBar />
<slot />
