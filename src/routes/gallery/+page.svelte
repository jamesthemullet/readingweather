<script lang="ts">
	import '../../styles/index.css';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	const monthNames = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'ImageGallery',
		name: `Photo Gallery ${data.selectedYear} – Reading Weather`,
		description: 'A photo gallery of weather conditions in Reading and Berkshire, organised by month and year.',
		url: `https://www.readingweather.co.uk/gallery?year=${data.selectedYear}`
	});

	const updateYear = (event: Event & { currentTarget: EventTarget & HTMLSelectElement }): void => {
		const selected = event.currentTarget.value;
		if (!selected) return;
		goto(`/gallery?year=${selected}`);
	};

	let lightboxUrl = $state('');
	let lightboxName = $state('');
	let lightboxWidth = $state<number | undefined>(undefined);
	let lightboxHeight = $state<number | undefined>(undefined);
	let lightboxDialog = $state<HTMLDialogElement | null>(null);
	let triggerButton = $state<HTMLButtonElement | null>(null);

	const openLightbox = (
		url: string,
		name: string,
		btn: HTMLButtonElement,
		width?: number,
		height?: number
	): void => {
		triggerButton = btn;
		lightboxUrl = url;
		lightboxName = name;
		lightboxWidth = width;
		lightboxHeight = height;
	};

	const closeLightbox = (): void => {
		lightboxDialog?.close();
	};

	const onDialogClose = (): void => {
		lightboxUrl = '';
		lightboxName = '';
		lightboxWidth = undefined;
		lightboxHeight = undefined;
		triggerButton?.focus();
		triggerButton = null;
	};

	$effect(() => {
		if (lightboxUrl && lightboxDialog && !lightboxDialog.open) {
			lightboxDialog.showModal();
		}
	});
</script>

<svelte:head>
	<title>Photo Gallery – Reading Weather</title>
	<meta name="description" content="A photo gallery of weather conditions in Reading and Berkshire, organised by month and year." />
	<meta property="og:title" content="Photo Gallery – Reading Weather" />
	<meta property="og:description" content="A photo gallery of weather conditions in Reading and Berkshire, organised by month and year." />
	<meta property="og:image" content="https://www.readingweather.co.uk/images/weather.png" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://www.readingweather.co.uk/gallery" />
	<meta name="twitter:title" content="Photo Gallery – Reading Weather" />
	<meta name="twitter:description" content="A photo gallery of weather conditions in Reading and Berkshire, organised by month and year." />
	<meta name="twitter:image" content="https://www.readingweather.co.uk/images/weather.png" />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
</svelte:head>

<h1>Photo Gallery</h1>

<article class="post">
	<div class="gallery-container">
		<div class="year-select-row">
			<label for="year-select">Year:</label>
			<select id="year-select" onchange={updateYear}>
				{#each data.years as year}
					<option value={year} selected={year === data.selectedYear}>{year}</option>
				{/each}
			</select>
		</div>

		{#if data.groupedPosts.length === 0}
			<p class="no-images">No photographs found for {data.selectedYear}.</p>
		{:else}
			{#each data.groupedPosts as { month, posts }}
				<section class="month-section">
					<h2>{monthNames[month - 1]} {data.selectedYear}</h2>
					<ul class="photo-grid">
						{#each posts as post}
							<li class="photo-item">
								<button onclick={(e) => openLightbox(post.featuredImage.node.sourceUrl, post.name, e.currentTarget as HTMLButtonElement, post.featuredImage.node.mediaDetails?.width, post.featuredImage.node.mediaDetails?.height)} aria-label="View full size: {post.name}">
									<img
										src={post.featuredImage.node.sourceUrl}
										alt={post.name}
										width={post.featuredImage.node.mediaDetails?.width ?? undefined}
										height={post.featuredImage.node.mediaDetails?.height ?? undefined}
										loading="lazy"
									/>
									<span class="photo-name" aria-hidden="true">{post.name}</span>
								</button>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		{/if}
	</div>
</article>

<dialog
	class="lightbox"
	bind:this={lightboxDialog}
	aria-label={lightboxName || 'Photo lightbox'}
	onclose={onDialogClose}
	onclick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
>
	<div class="lightbox-inner">
		<button class="lightbox-close" onclick={closeLightbox} aria-label="Close lightbox">&#x2715;</button>
		{#if lightboxUrl}
			<img src={lightboxUrl} alt={lightboxName} loading="eager" width={lightboxWidth} height={lightboxHeight} />
		{/if}
		{#if lightboxName}
			<p class="lightbox-name">{lightboxName}</p>
		{/if}
	</div>
</dialog>

<style>
	.gallery-container {
		padding: 1rem 2rem 2rem;
	}

	.year-select-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 2rem;
		justify-content: center;
	}

	.month-section {
		margin-bottom: 2.5rem;

		h2 {
			text-align: center;
			margin-bottom: 1rem;
			border-bottom: 2px solid var(--nav);
			padding-bottom: 0.25rem;
		}
	}

	.photo-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 1.25rem;
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.photo-item button {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		width: 100%;
		font-family: inherit;
		font-size: inherit;
		color: var(--text-color);

		&:hover img {
			opacity: 0.85;
		}

		&:focus-visible {
			outline: 3px solid #ffbf47;
			outline-offset: 2px;
		}
	}

	.photo-item img {
		width: 100%;
		height: 160px;
		object-fit: cover;
		display: block;
		transition: opacity 0.2s;
	}

	.photo-name {
		margin-top: 0.4rem;
		font-size: 0.9rem;
		text-align: center;
	}

	.no-images {
		text-align: center;
		margin: 2rem 0;
	}

	/* Lightbox */
	dialog.lightbox {
		border: none;
		padding: 0;
		background: transparent;
		max-width: 90vw;
		max-height: 90vh;
		overflow: visible;
	}

	:global(dialog.lightbox::backdrop) {
		background: rgba(0, 0, 0, 0.85);
	}

	.lightbox-inner {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.lightbox-inner img {
		max-width: 90vw;
		max-height: 80vh;
		object-fit: contain;
		display: block;
	}

	.lightbox-close {
		position: absolute;
		top: -2.25rem;
		right: 0;
		background: none;
		border: none;
		color: white;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		line-height: 1;
	}

	.lightbox-name {
		color: white;
		margin: 0.6rem 0 0;
		font-size: 1rem;
		text-align: center;
	}
</style>
