---
name: full-audit
description: Run a full audit of the ReadingWeather site (SvelteKit + TypeScript weather blog) covering test coverage (unit + e2e gaps), accessibility, performance, SEO, responsive/UX, security, code quality (typing, duplication, bad patterns, dead code), dependency health, and README/feature-scope alignment. Appends new findings to a persistent AUDIT.md checklist in the repo (existing checked-off items are preserved). Use when the user asks to audit, review the health of, or find improvements for the whole site — not for reviewing a single PR/diff, and not for a single-category deep dive (use the dedicated /accessibility, /performance, /security, /quality, or /tests skills for those).
---

# Full site audit

Produces a holistic health report for ReadingWeather: a SvelteKit 2 / Svelte 5 / TypeScript
weather blog and news site (`readingweather.co.uk`), backed by a WordPress GraphQL CMS for
content and a handful of SvelteKit server routes (`src/routes/api/`, `src/lib/server/`) for
comments, subscriptions, weather data, and sitemaps. This is NOT a PR/diff review — Biome lint,
`svelte-check` type-check, Knip dead-code check, unit tests, e2e tests, and an axe accessibility
scan are already enforced as CI gates on every PR (see `.github/workflows/pull_request_audit.yml`),
so **do not re-check whether the app lints/type-checks/builds/passes CI — it already does**. This
audit looks at things no single PR's gates catch: coverage gaps in files nobody has touched
recently, cross-cutting site quality (a11y, perf, SEO, security, UX) beyond what a single
axe-on-`/` CI run catches, and code quality that a passing lint/type-check doesn't guarantee (see
category 8).

This project also has narrower, single-category skills — `/accessibility`, `/performance`,
`/security`, `/quality`, `/tests` — that each pick one small fix per invocation and open a PR.
This skill is different: it's a broad, read-only sweep across all categories at once, recorded as
a checklist rather than immediately fixed.

## When to run this

User asks to "audit the site", "find ways to improve the website", "do a full review of the
app", or similar whole-app requests. If they ask about a single PR or the current diff, there is
no `/code-review` skill installed here — just review the diff directly. If they ask to fix one
specific category right now, prefer the matching single-category skill instead.

## Output

Findings live in a single persistent file at the repo root: **`AUDIT.md`**. This is not a
one-off report — it's a living checklist that accumulates across runs. Each run **appends**,
never replaces:

- `AUDIT.md` has one `## <n>. <Category>` section per category below, in the same order, each
  containing a flat markdown checklist (`- [ ] finding text (found: YYYY-MM-DD)`).
- **Before writing anything**, read the current `AUDIT.md` in full (create it from the template
  below if it doesn't exist yet).
- For each category, compare this run's findings against what's already listed in that section:
  - If a finding already exists (same issue, same file/route — wording may differ slightly),
    **do not duplicate it**. Leave the existing line untouched.
  - If an existing unchecked item no longer reproduces (verify, don't assume — re-check it),
    check it off and add `(resolved: YYYY-MM-DD, verified during audit)` rather than deleting
    the line, so there's a record.
  - **Never touch a line that's already checked off (`- [x]`)** — those are the user's own
    record of completed work. Leave them exactly as-is, in place.
  - Genuinely new findings get appended to the bottom of that section's list as new `- [ ]`
    items, dated.
- Add a line to the `## Run log` section at the top with today's date and a one-line summary
  (e.g. "2026-08-30 — 4 new findings (2 a11y, 1 security, 1 code quality), 1 item resolved").
- Do not renumber, reorder, or rewrite prose outside the checklists — this file is meant to be
  readable as a diff over time.

Do not modify application code during the audit unless the user explicitly asks you to fix
something after seeing the report — this skill is read-only/diagnostic aside from editing
`AUDIT.md` itself.

### AUDIT.md template (use this structure if the file doesn't exist yet)

```markdown
# Site Audit

Living checklist maintained by the `full-audit` skill. Findings are appended, never rewritten;
check an item off (`- [x]`) once you've fixed it and it won't be touched again. Re-running the
audit adds new findings to the bottom of each section and leaves checked items alone.

## Run log

- YYYY-MM-DD — initial audit

## 1. Test coverage — unit gaps and e2e

## 2. Accessibility

## 3. Performance

## 4. SEO / metadata

## 5. Responsive / UX

## 6. Security

## 7. README / feature-scope alignment

## 8. Code quality
```

## How to run it

Fan out the categories below as parallel forks or a general-purpose subagent per category (they
are independent and read-heavy — keep the raw output out of your main context). Have each one
**report findings back as text**, not write to `AUDIT.md` directly — only you should touch that
file, in a single merge pass at the end, so the dedup/checked-item rules above are applied
consistently in one place. Categories needing the browser (a11y/perf/responsive/e2e-walkthrough)
should run together in one browser-driving pass since they all need the app running.

Before starting, check whether a dev server is already running; if not, run `yarn build && yarn
preview` (port 4173, matches the Playwright config) or `yarn dev` (port 5173) yourself for the
duration of the audit, and stop it when done unless the user is already running one. Content
comes live from the WordPress GraphQL backend, so pages will render real posts — no seed data
needed.

### 1. Test coverage — unit gaps and e2e

- Run `yarn test:unit --run` (Vitest, `src/**/*.{test,spec}.{js,ts}`) and `yarn test:e2e`
  (Playwright, `e2e/*.test.ts`, runs against the built preview server on port 4173). Most source
  files already have a co-located `.spec.ts` — list any file under `src/` that has **no**
  sibling spec at all (not just low coverage), since that's the gap most likely to have been
  missed, and call out any `.spec.ts` that only smoke-tests rendering with no assertion on
  behaviour.
- Check `src/routes/api/*/+server.ts` handlers (`comment`, `subscribe`, `historical-weather`,
  `monthly-summary`, `weather-streak`, `week-in-history`, `weekly-digest`) each have validation
  and error-path coverage, not just the happy path.
- **E2e coverage**: current specs are `e2e/demo.test.ts`, `e2e/navigation.test.ts`,
  `e2e/subscribe.test.ts` (re-verify the actual list, don't assume it hasn't grown). Walk these
  flows in the browser via `claude-in-chrome` as a manual cross-check of what's automated:
  - Home page post list → click into a post (`/[slug]`) → comment form submit (valid + invalid)
  - Newsletter subscribe form (valid + invalid email, CSRF origin behaviour)
  - Nav across `/archives`, `/about`, `/gallery`, `/photographs`, `/seasonal-forecasts`,
    `/useful-links`, `/monthly-summary` (and its `[year]/[month]` sub-route)
  - `feed.xml`, `sitemap.xml`, `sitemap-2.xml` server routes return valid content
  For each flow, report whether it currently has e2e coverage and, if not, propose one new spec
  file per flow (matches the existing one-flow-per-file pattern in `e2e/`).

### 2. Accessibility

- Automated pass per route (axe via browser console injection, or Lighthouse a11y score through
  `claude-in-chrome`) — note that CI already runs `axe` against `/` only
  (`pull_request_audit.yml`), so treat every other route as unchecked by CI.
- Manual: color contrast, focus order/visible focus states, the mobile nav's keyboard-focus
  behaviour when closed, comment/subscribe form labels and error announcements, heading hierarchy
  per route.
- Cross-check against the baseline already documented in `.claude/skills/accessibility/SKILL.md`
  ("Known project patterns") so you don't re-report things already fixed or already known — but
  do re-verify anything listed there that looks stale.

### 3. Performance

- Lighthouse performance score and Core Web Vitals (LCP, CLS, INP) per route via
  `claude-in-chrome`.
- Vite build output: bundle size, unused JS/CSS, render-blocking resources, image weight (posts
  and photographs are image-heavy).
- Data fetching: waterfall vs. parallel GraphQL calls in `+page.server.ts` files, whether
  `src/lib/server/cache.ts` (in-memory, resets on restart) is actually used on the hot paths
  (`historicalWeather.ts`, `weeklyDigest.ts`, `weatherStreak.ts`, `weekInHistory.ts`,
  `monthlySummary.ts`), and whether `sitemap.xml` / `sitemap-2.xml` / `feed.xml` re-fetch all
  posts on every request.

### 4. SEO / metadata

- Per-route `<title>`/meta description, Open Graph tags, `src/app.html` defaults, presence and
  correctness of `sitemap.xml`/`sitemap-2.xml`/`feed.xml`/`robots.txt`, semantic heading structure
  per route, canonical URLs on paginated/archive views.

### 5. Responsive / UX

- Screenshot each route at ~375px and ~1280px via `claude-in-chrome`, including the mobile nav
  open/closed states and the comment/subscribe forms — look for anything that's drifted or was
  never verified holistically (e.g. interactions between components added in different PRs, the
  Ko-fi widget placement in `PostList.svelte` colliding with content).
- Console errors on load/navigation (`read_console_messages`), broken links, dead-end states
  (e.g. after a comment/subscribe submission, after a 404 on `/[slug]`).

### 6. Security

- Cross-check against `.claude/skills/security/SKILL.md`'s known patterns (CSRF via
  `ALLOWED_ORIGINS` origin check in `src/lib/server/config.ts`, input sanitisation via
  `src/lib/sanitize.ts`) rather than re-litigating them — only flag if a new route added since
  that skill's notes were written is missing the same protections.
- Dependency vulnerabilities: `yarn audit` (Renovate is configured via `renovate.json` — check
  its open PR backlog too).
- Response headers (CSP, HSTS, X-Content-Type-Options) — SvelteKit's `adapter-auto` output and
  wherever the site is actually hosted; note if headers can't be verified without knowing the
  live deploy target.
- `dompurify` usage on any WordPress-sourced HTML rendered with `{@html}` — confirm all such
  sinks are sanitised, not just the ones already documented.

### 7. README / feature-scope alignment

There's no `ROADMAP.md` in this repo — instead, diff the feature list and stack description in
`README.md` against what's actually live in `main`:

- Every route the README implies (posts, photographs, seasonal forecasts, archive, gallery,
  useful links, monthly summary) actually exists and works under `src/routes/`.
- The "Scripts" table in `README.md` matches the actual `scripts` in `package.json` (flag drift
  either way).
- Any GitHub issues opened by the `/product` skill (labelled `enhancement`) that are old, stale,
  or already superseded by something shipped since.

### 8. Code quality

A passing lint/type-check/build only proves the code compiles cleanly and satisfies Biome's
rules, not that it's precisely typed, non-duplicated, or free of dead weight — that's what this
category covers. Cross-check against `.claude/skills/quality/SKILL.md`'s known patterns first so
you don't re-report things already documented there as intentional (e.g. verbose GraphQL tagged
templates, existing `biome-ignore` suppressions with real explanations).

- **Strict typing** — `<script>` blocks missing `lang="ts"`, explicit `any`, unsafe `as Type`
  casts, missing return type annotations on exported functions, non-null assertions (`!`) that
  could be replaced with a proper guard, props or store values typed as `object`/`{}`/implicit
  `any`.
- **Code duplication** — repeated logic across `src/lib/components/` or `src/routes/`, identical
  `fetch`/GraphQL-variable-construction patterns that should share a helper (`src/lib/graphql/
  api.ts` is the intended shared entry point), values inlined 3+ times that should be a named
  constant.
- **Bad patterns** — inline `style=` attributes instead of scoped `<style>`/`src/styles/` classes,
  `biome-ignore` suppressions with empty or placeholder explanations, Svelte 5 rune misuse (legacy
  `export let`/`$:` instead of `$props()`/`$derived()`, `$effect` with overly broad or missing
  dependencies), magic numbers/strings, relative imports that should use the `$lib/` alias.
- **Dead code** — anything Knip's default run wouldn't already catch (check `knip.json`'s
  ignore list first so you don't re-flag `wait-on`/`axe`/`accented`), commented-out code blocks,
  server-only code in `src/lib/server/` accidentally reachable from a client-side import path.

## Notes

- This is a personal/small project — keep findings proportionate. Don't recommend enterprise-
  scale tooling (e.g. a full CI a11y pipeline covering every route) as a "blocker"; note it as a
  "nice to have" instead unless it's actually broken for a real user.
- Cite every finding with a route, file:line, or screenshot — no vague "could be improved"
  entries.
- **Every checklist item must be independently reviewable as one small PR** — same spirit as the
  single-category skills, which each scope one fix to one or two files. If a finding is actually
  a bundle of unrelated or large changes (e.g. "add e2e coverage for all forms", "improve
  accessibility across the app", "harden all API routes"), split it into several separate
  `- [ ]` lines, each scoped to a single reviewable change (e.g. one line per flow's e2e spec,
  one line per route's a11y fix, one line per API route's hardening issue). Never write a
  checklist item a reviewer couldn't approve or reject on its own without also weighing in on
  unrelated changes bundled into it.
