<script lang="ts">
	import { page } from '$app/stores';

	const links = [
		{ href: '/seasonal-forecasts', label: 'Seasonal Forecasts' },
		{ href: '/photographs', label: 'Photographs' },
		{ href: '/gallery', label: 'Gallery' },
		{ href: '/useful-links', label: 'Weather Links' },
		{ href: '/about', label: 'About' },
		{ href: '/archives', label: 'Archives' }
	];
	// biome-ignore lint/style/useConst: needed for Svelte reactivity ok
	let isOpen = false;
</script>

<nav class="navbar">
	<a href="/" class="home-button">Home </a>
	<button
		class="menu-button"
		on:click={() => (isOpen = !isOpen)}
		aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
		aria-expanded={isOpen}
		aria-controls="nav-menu"
	>
		<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24">
			<rect y="4" width="24" height="2" fill="currentColor" />
			<rect y="11" width="24" height="2" fill="currentColor" />
			<rect y="18" width="24" height="2" fill="currentColor" />
		</svg>
	</button>

	<ul
		id="nav-menu"
		class:open={isOpen}
		style="transition: {isOpen ? 'max-height 0.3s ease-out' : 'none'};"
	>
		{#each links as link}
			<li class:active={$page.url.pathname === link.href}>
				<a
					href={link.href}
					on:click={() => (isOpen = false)}
					aria-current={$page.url.pathname === link.href ? 'page' : undefined}>{link.label}</a
				>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.navbar {
		background: var(--nav);
		padding: 0 1rem;
		max-width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;

		@media screen and (min-width: 768px) {
			padding: 1rem;
		}

		.home-button {
			color: white;
			text-decoration: none;

			@media screen and (min-width: 768px) {
				position: absolute;
				left: 1rem;
			}
		}

		@media (min-width: 768px) {
			justify-content: center;
		}
	}

	.menu-button {
		display: none;
		background: none;
		border: none;
		font-size: 2rem;
		color: white;
		cursor: pointer;

		@media (max-width: 768px) {
			display: block;
		}
	}

	.navbar ul {
		list-style: none;
		display: flex;
		gap: 1rem;
		overflow: hidden;
		padding: 0 1rem;
		margin-top: 0.75rem;

		@media screen and (min-width: 768px) {
			margin-top: 0;
		}
	}

	.navbar ul.open {
		max-height: 500px;
	}

	.navbar li a {
		color: white;
		text-decoration: none;
	}

	.navbar li.active a,
	.navbar li a:hover {
		text-decoration: underline;

		@media (max-width: 768px) {
			text-decoration: none;
		}
	}

	/* Responsive styles */
	@media (max-width: 768px) {
		.navbar ul {
			background: var(--nav);
			flex-direction: column;
			position: absolute;
			top: 2rem;
			left: 0;
			right: 0;
			max-height: 0;
		}

		.navbar ul.open {
			max-height: 500px;
			padding-bottom: 1rem;
			padding-top: 1rem;
		}
	}
</style>
