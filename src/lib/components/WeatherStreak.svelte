<script lang="ts">
	import { onMount } from 'svelte';
	import type { WeatherStreakResult } from '$lib/api/weatherStreak';

	let streak = $state<WeatherStreakResult | null>(null);

	onMount(async () => {
		try {
			const res = await fetch('/api/weather-streak');
			if (res.ok) streak = (await res.json()) as WeatherStreakResult | null;
		} catch {
			// silently fail — weather data is supplementary
		}
	});
</script>

{#if streak}
	<section class="weather-streak">
		<p class="headline">
			<span aria-hidden="true">{streak.active.emoji}</span>
			<strong>{streak.active.headline}</strong>
			— {streak.active.context}
		</p>
		{#if streak.active.definition}
			<p class="definition">{streak.active.definition}</p>
		{/if}
		{#if streak.secondary.length > 0}
			<ul class="secondary">
				{#each streak.secondary as s}
					<li>
						<span aria-hidden="true">{s.emoji}</span>
						{s.headline} — {s.context}
						{#if s.definition}<span class="definition"> ({s.definition})</span>{/if}
					</li>
				{/each}
			</ul>
		{/if}
		<p class="conditions-note">
			Streak measured through {streak.asOf}. Weather conditions are sourced from ERA5
			reanalysis data and should be treated as an approximate guide only.
		</p>
	</section>
{/if}
