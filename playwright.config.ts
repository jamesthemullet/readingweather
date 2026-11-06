import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'yarn build && node scripts/check-ssr-requires.mjs && yarn preview',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		// Vercel's function runtime can't require() ES modules, but modern local
		// Node can, which hid an SSR-wide ERR_REQUIRE_ESM 500 from e2e. Disable it
		// for the preview server so e2e runs under the same constraint as prod.
		env: { NODE_OPTIONS: '--no-experimental-require-module' }
	},

	use: {
		baseURL: 'http://localhost:4173'
	},

	testDir: 'e2e'
});
