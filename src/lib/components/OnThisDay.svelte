<script lang="ts">
	import type { DailyWeather } from '$lib/api/historicalWeather';
	import type { OnThisDayPost } from '$lib/types';

	type Props = {
		posts: OnThisDayPost[];
		historicalWeather: DailyWeather[] | null;
	};

	const { posts, historicalWeather }: Props = $props();

	const currentYear = new Date().getFullYear();
	const historicalPosts = $derived(
		posts.filter((post) => new Date(post.date).getFullYear() < currentYear)
	);
	const getYear = (dateString: string): string => String(new Date(dateString).getFullYear());
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
									<span><span aria-hidden="true">↑</span><span class="sr-only">High: </span>{w.tempMax}°C</span>
									<span><span aria-hidden="true">↓</span><span class="sr-only">Low: </span>{w.tempMin}°C</span>
									{#if w.precipitation > 0}<span>{w.precipitation}mm rain</span>{/if}
									<span>{w.windSpeedMax} km/h wind</span>
								</div>
								<div class="weather-conditions">
									<span>Morning: {w.conditions.morning}</span>
									<span class="sep" aria-hidden="true">·</span>
									<span>Afternoon: {w.conditions.afternoon}</span>
									<span class="sep" aria-hidden="true">·</span>
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
						<time class="year" datetime={post.date}>{getYear(post.date)}</time>
						<a href="/{post.slug}">{post.title}</a>
					</li>
				{/each}
			</ul>
		</div>
	</article>
{/if}
