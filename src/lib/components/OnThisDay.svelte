<script lang="ts">
	import { onMount } from 'svelte';
	import type { DailyWeather } from '$lib/api/historicalWeather';

	export let posts: Array<{
		title: string;
		slug: string;
		date: string;
	}>;

	const currentYear = new Date().getFullYear();
	const historicalPosts = posts.filter((post) => new Date(post.date).getFullYear() < currentYear);
	const getYear = (dateString: string): string => String(new Date(dateString).getFullYear());

	let historicalWeather: DailyWeather[] | null = null;

	onMount(async () => {
		const today = new Date();
		try {
			const res = await fetch(
				`/api/historical-weather?month=${today.getMonth() + 1}&day=${today.getDate()}`
			);
			if (res.ok) historicalWeather = await res.json();
		} catch {
			// silently fail — weather data is supplementary
		}
	});
</script>

{#if historicalPosts.length > 0}
	<article class="post on-this-day">
		<h2>On This Day in Reading Weather</h2>
		<div class="content">
			{#if historicalWeather && historicalWeather.length > 0}
				<h3>Actual weather recorded</h3>
				<p class="conditions-note">
					Weather conditions are sourced from ERA5 reanalysis data and should be treated as an
					approximate guide only - in particular the cloud amounts seem to be greatly overstated.
				</p>
				<ul class="weather-list">
					{#each historicalWeather as w}
						<li class="weather-entry">
							<span class="year">{w.year}</span>
							<div class="weather-details">
								<div class="weather-stats">
									<span>↑{w.tempMax}°C</span>
									<span>↓{w.tempMin}°C</span>
									{#if w.precipitation > 0}<span>{w.precipitation}mm rain</span>{/if}
									<span>{w.windSpeedMax} km/h wind</span>
								</div>
								<div class="weather-conditions">
									<span>Morning: {w.conditions.morning}</span>
									<span class="sep">·</span>
									<span>Afternoon: {w.conditions.afternoon}</span>
									<span class="sep">·</span>
									<span>Evening: {w.conditions.evening}</span>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			{/if}

			<h3>Forecasts from previous years</h3>
			<ul class="on-this-day-list">
				{#each historicalPosts as post}
					<li>
						<span class="year">{getYear(post.date)}</span>
						<a href="/{post.slug}">{post.title}</a>
					</li>
				{/each}
			</ul>
		</div>
	</article>
{/if}

<style>
	h3 {
		font-size: 1rem;
		margin: 1.25rem 0 0.5rem;
		color: var(--nav);
	}

	.conditions-note {
		font-size: 0.8rem;
		color: #767676;
		margin: 0.25rem 0 0.75rem;
		font-style: italic;
	}

	.weather-list {
		list-style: none;
		padding: 0;
	}

	.weather-entry {
		display: flex;
		gap: 1rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid #eee;
		align-items: flex-start;
	}

	.weather-entry:last-child {
		border-bottom: none;
	}

	.year {
		font-family: var(--heading-font);
		font-size: 1.5rem;
		color: var(--nav);
		min-width: 4rem;
		font-weight: bold;
		flex-shrink: 0;
	}

	.weather-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.weather-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		font-size: 0.95rem;
	}

	.weather-conditions {
		font-size: 0.85rem;
		color: #555;
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		align-items: center;
	}

	.sep {
		color: #bbb;
	}

	.on-this-day-list {
		list-style: none;
		padding: 0 2rem;
	}

	.on-this-day-list li {
		display: flex;
		gap: 1rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid #eee;
		align-items: baseline;
	}

	.on-this-day-list li:last-child {
		border-bottom: none;
	}

	.on-this-day-list .year {
		font-size: 1.5rem;
	}
</style>
