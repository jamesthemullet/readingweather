<script lang="ts">
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	const MONTH_NAMES = [
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
</script>

<svelte:head>
	<title>Monthly Weather Report Cards | Reading Weather</title>
	<meta
		name="description"
		content="Browse monthly weather report cards for Reading, comparing each month's temperature, rainfall and sunshine against the historical average."
	/>
</svelte:head>

<h1>Monthly Weather Report Cards</h1>

<ul class="monthly-summary-index">
	{#each data.months as { year, month } (`${year}-${month}`)}
		<li>
			<a href="/monthly-summary/{year}/{String(month).padStart(2, '0')}">
				{MONTH_NAMES[month - 1]} {year}
			</a>
		</li>
	{/each}
</ul>
