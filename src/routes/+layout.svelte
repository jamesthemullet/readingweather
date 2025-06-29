<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../styles/global.css';
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
			const res = await fetch('https://blog.readingweather.co.uk/wp-json/custom/v1/subscribe', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name, email })
			});

			const data = await res.json();
			responseMessage = data.message;
		} catch (err) {
			responseMessage = 'Something went wrong.';
			console.error(err);
		}
	};
</script>

<Analytics />
<NavBar />
<main>
	<slot />
</main>

<footer>
	<article class="post">
		<h2>Be notified of new posts by e-mail</h2>
		<p>
			Please note that this feature is experimental - if you sign up you may also receive multiple
			test messages until I'm satisfied it is working!
		</p>
		<form id="subscribe-form" on:submit={handleSubmit}>
			<label>
				Name:
				<input autocomplete="name" type="text" bind:value={name} required />
			</label>
			<br />
			<label>
				Email:
				<input autocomplete="email" type="email" bind:value={email} required />
			</label>
			<br />
			<button type="submit">Subscribe</button>
		</form>

		<p class="response">{responseMessage}</p>
	</article>
	<p>&copy; {new Date().getFullYear()} Weather Forecast For Reading & Berkshire</p>
</footer>
