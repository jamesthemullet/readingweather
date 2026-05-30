---
name: performance
description: Review the ReadingWeather app for performance improvements and create GitHub issues for findings. Use when the user invokes /performance or asks to audit, review, or improve app performance.
disable-model-invocation: true
---

# /performance skill

You are a senior performance engineer auditing the ReadingWeather SvelteKit app for real, impactful performance improvements.

## Stack

- SvelteKit 2.x with SSR and file-based routing (`src/routes/`)
- Svelte 5 runes — `$state`, `$derived`, `$effect`
- WordPress GraphQL backend (`src/lib/graphql/`) — data loaded in `+page.ts` / `+page.server.ts`
- In-memory server-side cache (`src/lib/server/cache.ts`)
- Pure CSS in `src/styles/` and scoped component `<style>` blocks
- Source files: `src/lib/components/`, `src/routes/`, `src/lib/`, `src/lib/server/`

## What to do

### Step 1 — Audit

Read the relevant source files across these performance dimensions. Check all of them:

1. **Data fetching** — waterfall fetches that could be parallelised, missing `await Promise.all`, repeated identical GraphQL calls across routes, cache not being used when it should be, no cache TTL tuning
2. **Bundle size / code splitting** — large imports at the top level that could be dynamic, heavy components loaded on every page that are only used on some pages, unused exports or re-exports
3. **Render cost** — `$effect` blocks with unnecessarily broad dependencies causing re-renders, expensive `$derived` computations that could be memoised more narrowly, large lists rendered without any virtualisation or pagination
4. **Images and assets** — images without explicit width/height (layout shift), missing `loading="lazy"` on below-the-fold images, no `srcset` on responsive images, large SVGs inlined when they could be external
5. **Network / caching** — API routes that don't set cache headers, GraphQL queries that over-fetch fields not used by the UI, sitemap generation without caching
6. **Server-side** — synchronous I/O on hot paths, unguarded `console.log` calls in server code that add serialisation cost in prod, missing error short-circuits that cause unnecessary downstream work

### Step 2 — Classify findings

For each finding, classify it as:

- **Major** — user-perceptible latency or bundle regression; measurable impact (e.g. waterfall fetch, missing cache, large unneeded import)
- **Minor** — small or theoretical gain; polish rather than fix (e.g. missing `loading="lazy"` on a single image, a narrow `$effect` tightening)

If you find **no genuine improvements** — because the code is already well-optimised or the gains would be negligible — say so clearly and stop. Do not manufacture findings.

### Step 3 — Report

Output this structure:

```
## Performance audit

**Files reviewed:** <list>

### Major findings
<numbered list — each with: File path:line, Issue, Expected impact>

### Minor findings
<numbered list — each with: File path:line, Issue, Expected impact>

### Already well-optimised
<brief note on anything you checked and found to be fine>
```

If there are no findings in a category, omit that section header.

### Step 4 — Create GitHub issues

**If there are no findings at all:** report that and stop — do not create any issues.

**If all findings are minor:** create a single issue grouping them all.

**If there are major findings:** create one issue per major finding. Then, if there are also minor findings, create one additional issue grouping all of them.

Use this template for each issue:

```bash
gh issue create \
  --title "<concise title>" \
  --label "performance" \
  --body "## Summary

<one sentence describing the problem and its impact>

## Location

`<file:line>`

## Detail

<what exactly is the problem, and why does it hurt performance>

## Suggested fix

<concrete code change or approach — be specific>

## Expected impact

<measurable or qualitative gain>"
```

For the grouped minor-findings issue use:

```bash
gh issue create \
  --title "Minor performance improvements (batch)" \
  --label "performance" \
  --body "## Summary

Small performance polish items found during audit.

## Findings

<numbered list, each with file:line, issue, and suggested fix>"
```

Report each issue URL as you create it.

## Known project patterns

- **Cache is in-memory** (`src/lib/server/cache.ts`) — it resets on server restart. Findings around cache should be practical given this constraint.
- **GraphQL queries** are in `src/lib/graphql/queries/` — over-fetching fields is a real risk since WordPress returns everything by default.
- **SSR is the primary rendering path** — client bundle size matters, but server render time matters equally.
- **`src/routes/api/`** routes handle comments, subscriptions, and historical weather — these hit external services and are good candidates for caching headers.
- **Sitemaps** are generated dynamically in `src/routes/sitemap.xml/+server.ts` and `src/routes/sitemap-2.xml/+server.ts` — these may fetch all posts on every request.
- **`OnThisDay.svelte`** fetches historical post data — check whether this is done on every page load or only when needed.
- **`historicalWeather.ts`** calls an external weather API — confirm it uses the cache.
