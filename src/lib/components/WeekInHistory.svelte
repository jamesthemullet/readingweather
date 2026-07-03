<script lang="ts">
	import { onMount } from 'svelte';
	import type { WeekInHistory } from '$lib/api/weekInHistory';

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
				🌡️ Hottest day: <strong>{history.hottestDay.value}°C</strong> in {history.hottestDay.year}
			</li>
			<li>
				❄️ Coldest day: <strong>{history.coldestDay.value}°C</strong> in {history.coldestDay.year}
			</li>
			<li>
				🌧️ Wettest week (total rainfall): <strong>{history.wettestWeek.value}mm</strong> in {history
					.wettestWeek.year}
			</li>
		</ul>
		<p class="conditions-note">
			Weather conditions are sourced from ERA5 reanalysis data and should be treated as an
			approximate guide only
		</p>
	</section>
{/if}
