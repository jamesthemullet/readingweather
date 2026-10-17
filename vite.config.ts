import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	preview: {
		// Playwright's e2e CSRF test (e2e/subscribe-origin.test.ts) sends a request
		// with a non-local Host header to exercise the app's own origin check;
		// without this, Vite's preview server blocks it before the request reaches
		// the app.
		allowedHosts: ['example.com']
	},
	plugins: [
		sveltekit({
			// Consult https://svelte.dev/docs/kit/integrations
			// for more information about preprocessors
			preprocess: vitePreprocess(),

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter(),
			alias: {
				$lib: 'src/lib'
			},
			prerender: {
				handleHttpError: 'warn'
			}
		})
	],

	test: {
		projects: [
			{
				extends: true,
				test: {
					name: 'unit',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/lib/components/**/*.{test,spec}.{js,ts}']
				}
			},
			{
				extends: true,
				// Component specs render real DOM output, which requires Svelte's
				// client build (not the SSR build the rest of the suite uses).
				plugins: [svelteTesting()],
				test: {
					name: 'components',
					include: ['src/lib/components/**/*.{test,spec}.{js,ts}'],
					environment: 'happy-dom'
				}
			}
		]
	}
});
