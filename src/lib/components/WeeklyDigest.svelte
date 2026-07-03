<script lang="ts">
	import { onMount } from 'svelte';
	import type { WeeklyDigest } from '$lib/api/weeklyDigest';

	let digest = $state<WeeklyDigest | null>(null);

	function formatRange(startDate: string, endDate: string): string {
		const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
		const start = new Date(startDate).toLocaleDateString('en-GB', opts);
		const end = new Date(endDate).toLocaleDateString('en-GB', opts);
		return `${start} – ${end}`;
	}

	onMount(async () => {
		try {
			const res = await fetch('/api/weekly-digest');
			if (res.ok) digest = (await res.json()) as WeeklyDigest;
		} catch {
			// silently fail — weather data is supplementary
		}
	});
</script>

{#if digest}
	<section class="weekly-digest">
		<h2>Last Week in Reading</h2>
		<p class="range">{formatRange(digest.startDate, digest.endDate)}</p>
		<div class="stats">
			<span>↑{digest.tempHigh}°C</span>
			<span>↓{digest.tempLow}°C</span>
			<span>{digest.totalPrecipitation}mm rain</span>
			{#if digest.rainyDays > 0}
				<span>{digest.rainyDays} wet {digest.rainyDays === 1 ? 'day' : 'days'}</span>
			{/if}
		</div>
		<p class="summary">Mostly {digest.dominantConditions}.</p>
	</section>
{/if}
