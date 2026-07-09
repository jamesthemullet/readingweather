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

	function capitalize(text: string): string {
		return text.charAt(0).toUpperCase() + text.slice(1);
	}

	function formatDayList(days: string[]): string {
		if (days.length === 1) return days[0];
		return `${days.slice(0, -1).join(', ')} and ${days[days.length - 1]}`;
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
			<span><span aria-hidden="true">↑</span><span class="sr-only">High: </span>{digest.tempHigh}°C</span>
			<span><span aria-hidden="true">↓</span><span class="sr-only">Low: </span>{digest.tempLow}°C</span>
			<span>{digest.totalPrecipitation}mm rain</span>
			{#if digest.rainyDays > 0}
				<span>{digest.rainyDays} wet {digest.rainyDays === 1 ? 'day' : 'days'}</span>
			{/if}
		</div>
		<p class="summary">{capitalize(digest.dominantConditions)}.</p>
		<p class="detail">
			Sunniest day: {digest.sunniestDay.day} ({digest.sunniestDay.sunshineHours}h sun) · Cloudiest:
			{digest.cloudiestDay.day} ({digest.cloudiestDay.sunshineHours}h sun)
		</p>
		{#if digest.rainyDayNames.length > 0}
			<p class="detail">Rain fell on {formatDayList(digest.rainyDayNames)}.</p>
		{/if}
		<p class="conditions-note">
			Weather conditions are sourced from ERA5 reanalysis data and should be treated as an
			approximate guide only
		</p>
	</section>
{/if}
