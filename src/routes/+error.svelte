<script lang="ts">
	import '../styles/index.css';
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>{$page.status} — Reading Weather</title>
</svelte:head>

<section class="error-page">
	<h1>{$page.status}</h1>
	<p>{$page.error?.message ?? 'Something went wrong.'}</p>
	<a href="/">Back to home</a>
</section>
