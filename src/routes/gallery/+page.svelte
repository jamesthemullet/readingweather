<script lang="ts">
	import '../../styles/index.css';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	const monthNames = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	const updateYear = (event: Event) => {
		const selected = (event.target as HTMLSelectElement).value;
		if (!selected) return;
		window.location.href = `gallery?year=${selected}`;
	};

	const getImageName = (url: string): string => {
		const filename = url.split('/').pop()?.split('?')[0] ?? '';
		const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
		return nameWithoutExt
			.split(/[-_\s]+/)
			// Remove purely numeric segments (e.g. trailing numbers like "tina-2")
			.filter((word) => !/^\d+$/.test(word) && !/^jpe?g$/i.test(word) && !/^png$/i.test(word) && !/^webp$/i.test(word))
			.map((word) => word.replace(/\d+$/, ''))
			.filter((word) => word.length > 0)
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	let lightboxUrl = $state('');
	let lightboxName = $state('');

	const openLightbox = (url: string, name: string) => {
		lightboxUrl = url;
		lightboxName = name;
	};

	const closeLightbox = () => {
		lightboxUrl = '';
		lightboxName = '';
	};

	const onKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') closeLightbox();
	};
</script>

<svelte:head>
	<title>Photo Gallery – Reading Weather</title>
	<meta name="description" content="A photo gallery of weather conditions in Reading and Berkshire, organised by month and year." />
	<meta property="og:title" content="Photo Gallery – Reading Weather" />
	<meta property="og:description" content="A photo gallery of weather conditions in Reading and Berkshire, organised by month and year." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://www.readingweather.co.uk/gallery" />
</svelte:head>

<svelte:window onkeydown={onKeydown} />

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
							{@const name = getImageName(post.featuredImage.node.sourceUrl)}
							<li class="photo-item">
								<button
									onclick={() => openLightbox(post.featuredImage.node.sourceUrl, name)}
									aria-label="View full size: {name}"
								>
									<img
										src={post.featuredImage.node.sourceUrl}
										alt=""
										loading="lazy"
									/>
									<span class="photo-name" aria-hidden="true">{name}</span>
								</button>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		{/if}
	</div>
</article>

{#if lightboxUrl}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="lightbox-overlay" onclick={closeLightbox}>
		<div class="lightbox-content" onclick={(e) => e.stopPropagation()}>
			<button class="lightbox-close" onclick={closeLightbox} aria-label="Close">&#x2715;</button>
			<img src={lightboxUrl} alt={lightboxName} />
			{#if lightboxName}
				<p class="lightbox-name">{lightboxName}</p>
			{/if}
		</div>
	</div>
{/if}

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
	.lightbox-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.85);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.lightbox-content {
		position: relative;
		max-width: 90vw;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		align-items: center;

		img {
			max-width: 90vw;
			max-height: 80vh;
			object-fit: contain;
			display: block;
		}
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
