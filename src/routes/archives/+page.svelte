<script lang="ts">
	import '../../styles/index.css';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const updateArchive = (event: Event) => {
		const selected = (event.target as HTMLSelectElement).value;
		if (!selected) return;
		const [year, month] = selected.split('-');
		window.location.href = `archives/?year=${year}&month=${month}`;
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
	<title>Weather Forecast Archives</title>
</svelte:head>

<h1>Weather Forecast Archives</h1>
<article class="post">
	<div class="archive-container">
		<label for="archive-select">Select Month:</label>
		<select id="archive-select" on:change={updateArchive}>
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
