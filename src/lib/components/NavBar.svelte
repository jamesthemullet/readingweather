<script>
	import { page } from '$app/stores';

	let links = [
		{ href: '/seasonal-forecasts', label: 'Seasonal Forecasts' },
		{ href: '/photographs', label: 'Photographs' },
		{ href: '/useful-links', label: 'Weather Links' },
		{ href: '/about', label: 'About' }
	];
	let isOpen = false;
</script>

<nav class="navbar">
	<button class="menu-button" on:click={() => (isOpen = !isOpen)}> ☰ </button>

	<ul class:open={isOpen}>
		{#each links as link}
			<li class:active={$page.url.pathname === link.href}>
				<a href={link.href} on:click={() => (isOpen = false)}>{link.label}</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.navbar {
		background: var(--nav);
		padding: 1rem;
		max-width: 100%;
		display: flex;
		justify-content: center;

		@media (max-width: 768px) {
			justify-content: flex-end;
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
		transition: max-height 0.3s ease-out;
		overflow: hidden;
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
			top: 3rem;
			left: 0;
			right: 0;
			max-height: 0;
		}

		.navbar ul.open {
			max-height: 500px;
			padding-bottom: 1rem;
		}
	}
</style>
