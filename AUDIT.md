# Site Audit

Living checklist maintained by the `full-audit` skill. Findings are appended, never rewritten;
check an item off (`- [x]`) once you've fixed it and it won't be touched again. Re-running the
audit adds new findings to the bottom of each section and leaves checked items alone.

## Run log

- 2026-09-01 — initial audit: 62 findings (14 test coverage, 6 SEO, 3 a11y, 4 performance, 5 responsive/UX, 8 security, 8 README alignment, 7 code quality)

## 1. Test coverage — unit gaps and e2e

- [x] `yarn test:e2e` fails outright with `Error: http://localhost:4173 is already used` because `playwright.config.ts` has no `webServer.reuseExistingServer` set (defaults to `false`); add `reuseExistingServer: !process.env.CI` so it can run against a server already open in dev (found: 2026-09-01) (resolved: 2026-09-01, fixed by automated routine)
- [ ] `src/lib/components/AddComment.svelte` has no spec — contains form validation/submit logic, untested (found: 2026-09-01)
- [ ] `src/lib/components/Comment.svelte` has no spec (found: 2026-09-01)
- [ ] `src/lib/components/Comments.svelte` has no spec (found: 2026-09-01)
- [ ] `src/lib/components/NavBar.svelte` has no spec (found: 2026-09-01)
- [ ] `src/lib/components/OnThisDay.svelte` has no spec (found: 2026-09-01)
- [ ] `src/lib/components/PostList.svelte` has no spec (found: 2026-09-01)
- [ ] `src/lib/components/ShareButton.svelte` has no spec (found: 2026-09-01)
- [ ] `src/lib/components/WeatherStreak.svelte`, `WeekInHistory.svelte`, `WeeklyDigest.svelte` have no specs — no `@testing-library/svelte` usage exists anywhere in the repo, so the whole Svelte component/markup layer has zero test coverage even though every route's `+page.server.ts` load function is unit-tested (found: 2026-09-01)
- [x] `src/routes/api/historical-weather/+server.ts` has no `try/catch` around `fetchHistoricalWeather`, unlike every other cached API endpoint which returns a graceful 502 on upstream failure — untested and unhandled (found: 2026-09-01) (resolved: 2026-09-01, fixed by automated routine)
- [ ] `src/routes/api/comment/server.spec.ts` has no test for the `parentCommentId` (threaded reply) code path (`+server.ts:39-42`) (found: 2026-09-01)
- [ ] `src/routes/api/comment/server.spec.ts` has no test for the content/name/email truncation logic (`+server.ts:36-38`, `.slice(5000/100/254)`) (found: 2026-09-01)
- [ ] No e2e coverage of the post detail + comment flow (`/[slug]` → `AddComment.svelte`/`Comments.svelte`) — add `e2e/post-comment.test.ts`: navigate from `/` into the first post, submit the comment form with valid data (mocked success), then with an invalid email (mocked 400) and assert the error message appears without reload (found: 2026-09-01)
- [ ] `e2e/subscribe.test.ts` only mocks `**/api/subscribe` and never hits the real handler, so CSRF/origin behaviour is untested end-to-end — add `e2e/subscribe-origin.test.ts` using Playwright's `request` fixture to POST directly with a disallowed `Origin` header (expect 403) and malformed JSON (expect 400) (found: 2026-09-01)
- [ ] No e2e nav coverage for `/about`, `/gallery`, `/photographs`, `/seasonal-forecasts`, `/useful-links`, `/monthly-summary` (or its `[year]/[month]` sub-route) — add `e2e/nav-pages.test.ts` asserting a 200 response and page-specific heading for each (found: 2026-09-01)
- [ ] No e2e coverage of `/feed.xml`, `/sitemap.xml`, `/sitemap-2.xml` — add `e2e/feeds.test.ts` asserting 200, correct `content-type`, and expected root XML element for each (found: 2026-09-01)

## 2. Accessibility

- [ ] Weather-map images embedded in WordPress post body content (rendered via `{@html sanitize(...)}` in `PostList.svelte` and `[slug]/+page.svelte`) consistently have `alt=""` despite being informational pressure charts, not decorative — e.g. on `/sunday-30th-august-2026` — a recurring WCAG 1.1.1 gap across most post pages, not a one-off (found: 2026-09-01)
- [ ] `/seasonal-forecasts` renders ~69 consecutive `<h2>` elements with no intermediate structure or landmark grouping — hard to navigate by heading for screen-reader users; consider grouping under `<section>`s (found: 2026-09-01)
- [x] 404 page (`/[slug]` miss) has no explicit "back to home" CTA in the page body itself, relying only on the persistent nav bar — minor dead-end UX gap (found: 2026-09-01) (resolved: 2026-09-04, fixed by automated routine)

## 3. Performance

- [x] `/gallery` (`src/routes/gallery/+page.svelte:123`) hardcodes `loading="lazy"` on all 71 thumbnail `<img>`s, including ones visible above the fold — delays LCP; the homepage's `PostList.svelte` correctly sets `loading="eager"`/`fetchpriority="high"` on the first item, `/gallery` should match that pattern (found: 2026-09-01) (resolved: 2026-09-08, fixed by automated routine)
- [ ] Homepage hero image srcset from the CMS advertises a "960w" candidate but the actual decoded image is only 699×525px while displayed at 991×743px CSS size, causing visible upscale blur — likely a WordPress srcset-metadata generation issue worth flagging upstream (found: 2026-09-01)
- [ ] `src/routes/sitemap-2.xml/+server.ts` and `src/routes/sitemap.xml/+server.ts` both independently call `fetchSitemapPosts()` (same GraphQL query, up to 10,000 posts) on every request — `sitemap-2.xml` is a near-duplicate that only differs by omitting `/records` and `/gallery`; `static/robots.txt` references only `sitemap.xml`, making `sitemap-2.xml` a live but orphaned, redundantly-fetching duplicate that should be removed or intentionally wired in (found: 2026-09-01)
- [ ] `src/lib/server/sitemap.ts`'s `toXmlUrl` never emits `<lastmod>` for static routes (only for post nodes) — `/`, `/about`, `/archives`, etc. have no lastmod hint (found: 2026-09-01)

## 4. SEO / metadata

- [ ] `src/routes/[slug]/+page.svelte:109` post title is raw `{postTitle}` with no site-name suffix, unlike `/records` and `/monthly-summary` which append `| Reading Weather` — inconsistent title format across routes (found: 2026-09-01)
- [ ] `src/routes/+layout.svelte:50` sets the canonical URL globally from `$page.url.pathname` only (no query string), so `/archives?year=2024&month=3` and bare `/archives` (and `/gallery?year=2023` vs `/gallery`) all canonicalize to the same URL — should be a deliberate, documented choice (self-referencing canonical or explicit noindex) rather than an accidental side effect (found: 2026-09-01)
- [ ] `src/lib/server/sitemap.ts` omits `/monthly-summary` and all `/monthly-summary/[year]/[month]` pages entirely from both sitemaps, despite these being indexable content pages with unique per-month data (found: 2026-09-01)
- [x] `static/robots.txt` has no explicit `Disallow` for `/api/*` routes (found: 2026-09-01) (resolved: 2026-09-03, fixed by automated routine)
- [ ] `src/app.html` has no fallback `<title>`/`<meta name="description">` in the static head — relies entirely on `%sveltekit.head%` injection; confirm SSR always renders these before hydration (found: 2026-09-01)
- [ ] No sitewide `og:image:width`/`og:image:height` fallback set anywhere — some social-card debuggers need these for correct rendering (found: 2026-09-01)

## 5. Responsive / UX

- [ ] Could not verify true mobile-viewport (375px) vs desktop (1280px) rendering via automated screenshot this run — `resize_window` didn't change `window.innerWidth` from the OS-maximized 2560px in this session; `NavBar.svelte`'s `@media (max-width: 768px)` rules look internally consistent on code review but need a live-viewport pass to confirm no overlap (found: 2026-09-01)
- [ ] `src/lib/kofi.ts`'s `injectKofiWidget()` sets a fixed `height='612'` iframe inline into post content with no positioning CSS found in `src/styles/index.css` — structurally looks fine but couldn't be visually confirmed at mobile width this run due to the viewport-resize issue above (found: 2026-09-01)

## 6. Security

- [ ] `src/lib/sanitize.ts` returns HTML **unmodified/unsanitized** whenever `!browser` (i.e. during SSR) — since SvelteKit server-renders by default, every `{@html sanitize(...)}` sink ships raw, unsanitized HTML in the initial server response; DOMPurify only runs on client-side re-renders, not the SSR output that gets hydrated (found: 2026-09-01)
- [ ] `src/lib/components/Comment.svelte:63` — `{@html sanitize(comment.content)}` renders user-submitted comment content; due to the SSR-bypass above, this is an unsanitized XSS vector for any comment containing malicious markup, in the SSR'd HTML (found: 2026-09-01)
- [ ] `src/lib/components/PostList.svelte:40,43` — same SSR-sanitization-bypass sink for post excerpt/content (found: 2026-09-01)
- [ ] `src/routes/about/+page.svelte:35`, `src/routes/photographs/+page.svelte:37`, `src/routes/useful-links/+page.svelte:42`, `src/routes/[slug]/+page.svelte:149` — same SSR-sanitization-bypass sink for WP page/post content; lower severity (CMS-author-controlled) but still a defense gap if the WP account is compromised (found: 2026-09-01)
- [x] `src/routes/[slug]/+page.svelte:125` JSON-LD is injected via `{@html ...}` without escaping `</script>` inside the JSON payload — a post title/description containing the literal string `</script>` breaks out of the script tag and allows markup/script injection; `src/routes/monthly-summary/+page.svelte:54` already escapes this correctly (`&lt;\/script&gt;`), making it an inconsistently-applied fix rather than a one-off — audit and fix all `jsonLd` `{@html}` sinks under `src/routes` (found: 2026-09-01) (resolved: 2026-09-02, fixed by automated routine)
- [ ] `yarn audit` flags 1 low-severity transitive vuln: `cookie <0.7.0` (CVE-2024-47764) via `@sveltejs/kit@2.70.3` — not exploitable in this app's flow but worth tracking via the normal Renovate bump (found: 2026-09-01)
- [ ] No `Strict-Transport-Security` header set anywhere in `src/hooks.server.ts` (which does set X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP) — may be supplied by the hosting platform under `adapter-auto` but unverifiable from source; confirm on the live deploy target (found: 2026-09-01)
- [ ] `renovate.json` doesn't enable `osvVulnerabilityAlerts` for dedicated security-vulnerability PRs, relying only on the general minor/patch grouping schedule (found: 2026-09-01)

## 7. README / feature-scope alignment

- [ ] `README.md` (intro line) doesn't mention several live routes: `gallery`, `useful-links`, `records`, `monthly-summary` (+ `[year]/[month]` sub-route), `about` (found: 2026-09-01)
- [ ] `README.md` says "an archive" but the actual route directory is `src/routes/archives` (plural) — minor wording mismatch (found: 2026-09-01)
- [ ] `package.json` script `prepare` (`svelte-kit sync`) is undocumented in the README Scripts table (found: 2026-09-01)
- [ ] `package.json` script `ts-check` (duplicate of `check`) is undocumented in the README Scripts table — also worth asking whether it's dead/redundant given `check` does the same thing (found: 2026-09-01)
- [ ] `package.json` script `check:watch` is undocumented in the README Scripts table (found: 2026-09-01)
- [ ] `package.json` script `format` (prettier) is undocumented in the README Scripts table, and Prettier isn't mentioned in README's Tech stack section despite `prettier`/`prettier-plugin-svelte` being devDependencies (found: 2026-09-01)
- [ ] `package.json` script `knip` is undocumented in the README Scripts table, and Knip isn't mentioned in README's Tech stack section despite being a devDependency (found: 2026-09-01)
- [ ] GitHub issue #467 ("feat: Live 'Month in Progress' page", `enhancement`) opened 2026-08-30 is still open and unaddressed — no superseding `monthly-summary/current` route exists; legitimate open item worth triaging (found: 2026-09-01)

## 8. Code quality

- [ ] `src/routes/api/weekly-digest/+server.ts`, `week-in-history/+server.ts`, `records/+server.ts`, `weather-streak/+server.ts`, `monthly-summary/+server.ts` all implement byte-for-byte identical "check cache → check error-cache → fetch → cache result or error" control flow — extract a shared `withCachedFetch(key, ttl, errorTtl, fn, errorMessage)` helper (found: 2026-09-01)
- [ ] `src/lib/api/recordsTracker.ts:149-162` and `src/lib/api/monthlySummary.ts:232-245` contain an identical `fetchArchive` retry-with-backoff function (including the same comment) — extract to a shared module, e.g. `src/lib/api/openMeteo.ts` (found: 2026-09-01)
- [ ] `READING_LAT`/`READING_LON` constants, the Open-Meteo base URL, and the `Open-Meteo error: ${response.status}` message are duplicated identically across `src/lib/api/historicalWeather.ts`, `monthlySummary.ts`, `recordsTracker.ts`, `weatherStreak.ts`, `weekInHistory.ts`, `weeklyDigest.ts` — extract to a single shared constants/helper module (found: 2026-09-01)
- [ ] `src/routes/about/+page.server.ts`, `useful-links/+page.server.ts`, `photographs/+page.server.ts` are byte-identical except for a hardcoded `pageId` literal (2, 161, 169) with no comment tying the number to which WP page it is — extract a shared `loadPageById(id)` factory with named constants (found: 2026-09-01)
- [ ] `src/lib/components/OnThisDay.svelte:66-152` uses a `<style>` block instead of `src/styles/index.css`, against project convention (found: 2026-09-01)
- [ ] `src/lib/components/NavBar.svelte:60-158` uses a `<style>` block instead of `src/styles/index.css` (found: 2026-09-01)
- [ ] `src/routes/gallery/+page.svelte:155` onward uses a `<style>` block instead of `src/styles/index.css` (found: 2026-09-01)
