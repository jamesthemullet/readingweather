<script lang="ts">
	import type { PageProps } from '../about/$types';

	const { data }: PageProps = $props();

	let name = $state('');
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

<svelte:head>
	<title>{data.page.title}</title>
	<meta name="description" content={data.page.seo.description} />
	<meta property="og:title" content={data.page.title} />
	<meta property="og:description" content={data.page.seo.description} />
	{#if data.page.featuredImage?.node?.sourceUrl}
		<meta property="og:image" content={data.page.featuredImage.node.sourceUrl} />
	{/if}
	<meta property="og:type" content="article" />
	<meta property="og:url" content={`https://www.readingweather.co.uk/${data.page.slug}`} />
</svelte:head>

{#if data.page}
	<h1>{data.page.title}</h1>
	<article class="post">
		<div class="content">{@html data.page.content}</div>
	</article>
{/if}

<article class="post">
	<h2>Be notified of new posts by e-mail</h2>
	<p>
		Please note that this feature is experimental - if you sign up you will also receive test
		messages until I'm satisfied it is working!
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
