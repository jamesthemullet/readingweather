<script lang="ts">
	import { onMount } from 'svelte';
	import type { WeekInHistory } from '$lib/api/weekInHistory';
	import ShareButton from '$lib/components/ShareButton.svelte';

	let history = $state<WeekInHistory | null>(null);

	onMount(async () => {
		try {
			const res = await fetch('/api/week-in-history');
			if (res.ok) history = (await res.json()) as WeekInHistory;
		} catch {
			// silently fail — weather data is supplementary
		}
	});
</script>

{#if history}
	<section class="week-in-history">
		<h2>This Week in Reading Weather History</h2>
		<p class="range">{history.windowLabel} · {history.yearsOfData} years of records</p>
		<ul class="records">
			<li>
				<span aria-hidden="true">🌡️</span> Hottest day: <strong>{history.hottestDay.value}°C</strong> in {history.hottestDay.year}
			</li>
			<li>
				<span aria-hidden="true">❄️</span> Coldest day: <strong>{history.coldestDay.value}°C</strong> in {history.coldestDay.year}
			</li>
			<li>
				<span aria-hidden="true">🌧️</span> Wettest week (total rainfall): <strong>{history.wettestWeek.value}mm</strong> in {history
					.wettestWeek.year}
			</li>
		</ul>
		<p class="conditions-note">
			Weather conditions are sourced from ERA5 reanalysis data and should be treated as an
			approximate guide only
		</p>
		<ShareButton
			postUrl="https://www.readingweather.co.uk/"
			postTitle="This Week in Reading Weather History"
			postSummary="Wettest week on record in Reading: {history.wettestWeek.value}mm in {history
				.wettestWeek.year}"
			card="week_in_history"
		/>
	</section>
{/if}
