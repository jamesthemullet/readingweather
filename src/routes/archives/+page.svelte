<script lang="ts">
	import '../../styles/index.css';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	const updateArchive = (event: Event & { currentTarget: EventTarget & HTMLSelectElement }): void => {
		const selected = event.currentTarget.value;
		if (!selected) return;
		const [year, month] = selected.split('-');
		goto(`/archives?year=${year}&month=${month}`);
	};

	const getMonthName = (month: number): string => {
		const monthNames = [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December'
		];
		return monthNames[month - 1];
	};
</script>

<svelte:head>
	<title>Weather Forecast Archives – Reading Weather</title>
	<meta name="description" content="Browse the archives of weather forecasts for Reading and Berkshire, searchable by month and year." />
	<meta property="og:title" content="Weather Forecast Archives – Reading Weather" />
	<meta property="og:description" content="Browse the archives of weather forecasts for Reading and Berkshire, searchable by month and year." />
	<meta property="og:image" content="https://www.readingweather.co.uk/images/weather.png" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://www.readingweather.co.uk/archives" />
	<meta name="twitter:title" content="Weather Forecast Archives – Reading Weather" />
	<meta name="twitter:description" content="Browse the archives of weather forecasts for Reading and Berkshire, searchable by month and year." />
	<meta name="twitter:image" content="https://www.readingweather.co.uk/images/weather.png" />
</svelte:head>

<h1>Weather Forecast Archives</h1>
<article class="post">
	<div class="archive-container">
		<label for="archive-select">Select Month:</label>
		<select id="archive-select" onchange={updateArchive}>
			<option value="">-- Select --</option>
			{#each data.archives as archive}
				<option
					value="{archive.year}-{archive.month}"
					selected={archive.year === data.selectedYear && archive.month === data.selectedMonth}
				>
					{getMonthName(archive.month)}
					{archive.year}
				</option>
			{/each}
		</select>

		{#if data.selectedYear && data.selectedMonth}
			<h2>Posts from {getMonthName(data.selectedMonth)} {data.selectedYear}</h2>
			<ul>
				{#each data.posts as post}
					<li><a href="/{post.slug}">{post.title}</a></li>
				{/each}
			</ul>
		{:else}
			<p>Select a month to view posts.</p>
		{/if}
	</div>
</article>
