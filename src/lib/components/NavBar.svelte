<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	const links = [
		{ href: '/seasonal-forecasts', label: 'Seasonal Forecasts' },
		{ href: '/records', label: 'Records' },
		{ href: '/photographs', label: 'Photographs' },
		{ href: '/gallery', label: 'Gallery' },
		{ href: '/useful-links', label: 'Weather Links' },
		{ href: '/about', label: 'About' },
		{ href: '/archives', label: 'Archives' }
	];
	let isOpen = $state(false);
	let isMobile = $state(false);

	onMount(() => {
		const mq = window.matchMedia('(max-width: 768px)');
		isMobile = mq.matches;
		const handler = (e: MediaQueryListEvent) => {
			isMobile = e.matches;
			if (!e.matches) isOpen = false;
		};
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape' && isOpen) isOpen = false; }} />

<nav class="navbar" aria-label="Main navigation">
	<a href="/" class="home-button">Home</a>
	<button
		class="menu-button"
		onclick={() => (isOpen = !isOpen)}
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

	<ul id="nav-menu" class:open={isOpen} inert={isMobile && !isOpen}>
		{#each links as link}
			<li class:active={$page.url.pathname === link.href}>
				<a
					href={link.href}
					onclick={() => (isOpen = false)}
					aria-current={$page.url.pathname === link.href ? 'page' : undefined}>{link.label}</a
				>
			</li>
		{/each}
	</ul>
</nav>
