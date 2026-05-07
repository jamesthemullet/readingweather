# Reading Weather

A personal blog and weather site built with SvelteKit, featuring posts, photographs, seasonal forecasts, and an archive.

## Tech stack

- [SvelteKit](https://kit.svelte.dev/) — framework
- [Vite](https://vite.dev/) — build tool
- [TypeScript](https://www.typescriptlang.org/) — type checking
- [Biome](https://biomejs.dev/) — linting and formatting
- [Vitest](https://vitest.dev/) — unit tests
- [Playwright](https://playwright.dev/) — end-to-end tests

## Getting started

Install dependencies:

```bash
yarn
```

Start the dev server:

```bash
yarn dev
```

## Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start development server |
| `yarn build` | Build for production |
| `yarn preview` | Preview production build |
| `yarn test` | Run unit and e2e tests |
| `yarn test:unit` | Run unit tests (Vitest) |
| `yarn test:e2e` | Run e2e tests (Playwright) |
| `yarn lint` | Lint with Biome |
| `yarn lint:fix` | Lint and auto-fix |
| `yarn check` | Type-check with svelte-check |
