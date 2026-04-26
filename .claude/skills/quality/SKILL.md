---
name: quality
description: Incrementally improve code quality for this SvelteKit / TypeScript project. Use when the user invokes /quality or asks to fix a code smell, improve code quality, or clean up the codebase.
disable-model-invocation: true
---

# /quality skill

You are running an incremental code quality improvement session for this SvelteKit / TypeScript project.

## Stack

- SvelteKit 2.x with file-based routing (`src/routes/`)
- TypeScript 6.x — Svelte script blocks should use `lang="ts"`
- Svelte 5 runes: `$state`, `$props`, `$derived`, `$effect` (prefer these over legacy reactive syntax)
- Svelte stores (`svelte/store`) in `src/lib/stores/` — `showAddComment` is the current store
- Pure CSS in scoped `<style>` blocks and `src/styles/` — no CSS-in-JS, no Tailwind
- Biome for linting (`biome.json`) — strict style and correctness rules enabled
- Knip for unused code detection (`knip.json`)
- Source files live in: `src/lib/components/`, `src/routes/`, `src/lib/stores/`, `src/lib/graphql/`, `src/lib/`

## What to do each invocation

### Step 1 — Pick a category

Use the current second of the clock (or any arbitrary signal) to pick **one** of these four categories. Vary the selection — do not always pick the same one:

1. **Strict typing** — look for: `<script>` blocks missing `lang="ts"`, explicit `any`, unsafe `as Type` casts, missing return type annotations on exported functions, non-null assertions (`!`) that could be replaced with proper guards, props typed as `object` or `{}`, untyped Svelte store values
2. **Code duplication** — look for: repeated logic blocks across components or routes, identical `fetch` patterns that could share a helper, GraphQL query variables constructed identically in multiple places, values inlined 3+ times that should be a named constant
3. **Bad patterns** — look for: inline `style=` attributes instead of CSS classes (this project uses scoped CSS), `biome-ignore` suppressions with empty or placeholder explanations, Svelte 5 runes misuse (e.g. `$effect` with overly broad deps, reactive state not declared with `$state`), magic numbers/strings, unnecessary `.forEach` where `for...of` is cleaner
4. **Dead code** — look for: exported symbols not imported anywhere in the project, commented-out code blocks, unused imports in `<script>` blocks

### Step 2 — Find the best candidate

Read the relevant source files in `src/lib/components/`, `src/routes/`, `src/lib/`, and `src/lib/stores/`. Identify the **single clearest, most impactful** instance of the chosen category. Prefer issues that:

- Are in frequently-used files
- Have an unambiguous fix
- Won't require changes across many files

### Step 3 — Fix it

Make the fix. Keep scope tight — one issue, one or two files. Do not refactor beyond what is needed to address the specific finding.

### Step 4 — Report

Output exactly this structure:

```
## Quality improvement

**Category:** <chosen category name>
**File:** <path:line>
**Issue:** <one sentence describing the problem>
**Fix:** <what was changed and why>
**Next suggestion:** <the next candidate worth tackling in this category, with file path>
```

## Known project patterns

- **Inline styles are a smell**: This project uses scoped CSS `<style>` blocks and CSS classes for all styling. Inline `style=` attributes are a pattern to flag and move into CSS classes.
- **Svelte 5 runes**: Components use `$props()`, `$state()`, `$derived()`, `$effect()` — the legacy `export let`, `$:`, and `onMount` patterns should be migrated if found.
- **`biome-ignore` comments**: Legitimate suppressions exist (e.g. `noForEach` on `threaded.forEach` in `[slug]/+page.svelte`). Only flag suppressions with empty/missing explanations or where the suppressed rule violation could be easily fixed instead.
- **Knip ignore list**: `ignoreBinaries: ["wait-on", "axe"]` are intentional — do not flag these.
- **`$lib` path alias**: All internal imports should use `$lib/...`, not relative paths like `../../lib/...`.
- **Server vs client**: Files in `src/lib/server/` are server-only. Files in `src/routes/api/` are API endpoints. Do not move server-only code to client-accessible paths.
- **GraphQL queries**: Live in `src/lib/graphql/queries/` as tagged template literals — these are intentionally verbose and should not be condensed.
