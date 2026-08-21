<script lang="ts">
	import ShareButton from '$lib/components/ShareButton.svelte';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	const records = $derived(data.records);

	const postUrl = 'https://www.readingweather.co.uk/records';
	const postTitle = $derived(`Reading Weather Records ${records.year}`);
	const postSummary = $derived(
		records.brokenRecords.length > 0
			? `${records.brokenRecords.length} weather record${records.brokenRecords.length === 1 ? '' : 's'} broken in Reading so far in ${records.year}`
			: `Tracking Reading's weather records for ${records.year}`
	);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'Dataset',
		name: postTitle,
		description: postSummary,
		url: postUrl,
		temporalCoverage: String(records.year),
		spatialCoverage: {
			'@type': 'Place',
			name: 'Reading, UK'
		},
		creator: {
			'@type': 'Organization',
			name: 'Reading Weather',
			url: 'https://www.readingweather.co.uk'
		}
	});

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC'
		});
	}

	// The monthly-summary route only publishes fully completed months, so a record set
	// during the current, still-in-progress month has nowhere to link to yet.
	function monthlySummaryHref(dateStr: string): string | null {
		const [year, month] = dateStr.split('-');
		const [asOfYear, asOfMonth] = records.asOfDate.split('-');
		if (year === asOfYear && month === asOfMonth) return null;
		return `/monthly-summary/${year}/${month}`;
	}
</script>

<svelte:head>
	<title>{postTitle} | Reading Weather</title>
	<meta name="description" content={postSummary} />
	<meta property="og:title" content={postTitle} />
	<meta property="og:description" content={postSummary} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={postUrl} />
	<meta name="twitter:title" content={postTitle} />
	<meta name="twitter:description" content={postSummary} />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
</svelte:head>

<h1>{postTitle}</h1>

<section class="records-tracker">
	<p class="range">As of {records.asOf} · {records.yearsOfData} years of ERA5 records since 1940</p>

	<div class="stat-group">
		<h2>Records broken this year</h2>
		{#if records.brokenRecords.length === 0}
			<p>No all-time records have been broken in Reading yet in {records.year}.</p>
		{:else}
			<ul class="records">
				{#each records.brokenRecords as record (record.date + record.metric)}
					<li>
						<span aria-hidden="true">{record.emoji}</span>
						{record.label}: <strong>{record.value}{record.unit}</strong>
						—
						{#if monthlySummaryHref(record.date)}
							<a href={monthlySummaryHref(record.date)}>{formatDate(record.date)}</a>
						{:else}
							{formatDate(record.date)}
						{/if}
						<span class="new-record">New record</span>
						<span class="previous">
							(previous: {record.previousValue}{record.unit}, {formatDate(record.previousDate)})
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	{#if records.nearMisses.length > 0}
		<div class="stat-group">
			<h2>Near misses</h2>
			<p class="range">Days that entered the all-time top 10 without quite breaking the record.</p>
			<ul class="records">
				{#each records.nearMisses as nearMiss (nearMiss.date + nearMiss.metric)}
					<li>
						<span aria-hidden="true">{nearMiss.emoji}</span>
						{nearMiss.label}: <strong>{nearMiss.value}{nearMiss.unit}</strong>
						—
						{#if monthlySummaryHref(nearMiss.date)}
							<a href={monthlySummaryHref(nearMiss.date)}>{formatDate(nearMiss.date)}</a>
						{:else}
							{formatDate(nearMiss.date)}
						{/if}
						<span class="near-miss">#{nearMiss.rank} all time</span>
						<span class="previous">
							(record: {nearMiss.recordValue}{nearMiss.unit}, {formatDate(nearMiss.recordDate)})
						</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<div class="stat-group">
		<h2>All-time records for Reading</h2>
		<ul class="records">
			{#each records.allTimeRecords as record (record.metric)}
				<li>
					<span aria-hidden="true">{record.emoji}</span>
					{record.label}: <strong>{record.value}{record.unit}</strong>
					—
					{#if monthlySummaryHref(record.date)}
						<a href={monthlySummaryHref(record.date)}>{formatDate(record.date)}</a>
					{:else}
						{formatDate(record.date)}
					{/if}
				</li>
			{/each}
		</ul>
	</div>

	<p class="conditions-note">
		Weather records are sourced from ERA5 reanalysis data and should be treated as an approximate
		guide only
	</p>
</section>

<ShareButton {postUrl} {postTitle} {postSummary} />
