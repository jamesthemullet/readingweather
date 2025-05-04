<script>
	let email = '';
	let message = '';

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Clear previous messages
		message = '';

		try {
			const response = await fetch(
				'https://blog.readingweather.co.uk/wp-json/custom/v1/subscribe',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ email })
				}
			);

			const data = await response.json();

			if (data.success) {
				message = 'You have successfully subscribed!';
			} else {
				message = data.error || 'An error occurred';
			}
		} catch (error) {
			message = 'An error occurred while submitting the form';
		}
	};
</script>

<form on:submit={handleSubmit}>
	<label for="email">Enter your email:</label>
	<input type="email" id="email" bind:value={email} placeholder="Your email address" required />
	<button type="submit">Subscribe</button>
</form>

{#if message}
	<p>{message}</p>
{/if}
