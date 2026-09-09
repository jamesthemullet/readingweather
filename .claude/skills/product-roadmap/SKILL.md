---
name: product-roadmap
description: Build or refresh a product roadmap for Reading Weather — new features, pages, and content, PLUS making existing content easier to find, SEO, and improvements to features/pages that already exist — grounded in what the site already has. Writes a plain markdown ROADMAP.md at the repo root, grouped into Now/Next/Later, with each feature broken into a sequence of ~15-minute-reviewable PR steps. Use when the user asks for a roadmap, growth ideas, "what should we build next", or to update/rescope the existing roadmap.
---

# Product roadmap

Produces (or refreshes) **`ROADMAP.md`** at the repo root for `readingweather`: a SvelteKit
personal blog and weather site with posts, a photo gallery, seasonal forecasts, a records section,
a monthly summary, an RSS feed (`feed.xml`), and an archive. Roadmap items are scored against what
actually grows and deepens engagement with a personal blog/weather site. Covers more than new
features:

- **Findability** — making posts/photos/records easier to browse as the archive grows: better
  cross-linking between `archives`, `gallery`, `records`, `seasonal-forecasts`.
- **SEO** — the site already has a sitemap and RSS — next-level plays are structured data on
  posts/records, and indexable content for weather-record search intent.
- **Improving what already exists** — `monthly-summary`, `records`, `seasonal-forecasts`, and
  `gallery` are all live routes; extending them is often cheaper than a new feature.

## Grounding the roadmap in the real app

- `README.md` — stated as "a personal blog and weather site... featuring posts, photographs,
  seasonal forecasts, and an archive."
- `AUDIT.md` if present — don't duplicate known bugs/gaps as roadmap features; those are health
  fixes.
- `package.json` — SvelteKit 2, Svelte 5, `dompurify` (sanitizing user/CMS HTML somewhere); no
  database/auth package visible — confirm before proposing anything needing persistence.
- `src/routes/` — real routes: `[slug]` (posts), `about`, `api/`, `archives`, `feed.xml`,
  `gallery`, `monthly-summary`, `photographs`, `records`, `seasonal-forecasts`, `sitemap.xml`,
  `sitemap-2.xml`, `useful-links`.

## Output format

Plain markdown. Write directly to `ROADMAP.md` at the repo root, overwriting the previous
version. Structure: intro + 4 goal-tag lenses (Acquisition/Engagement/Retention/Fun) →
PR-sequence explainer → Now/Next/Later sections, each feature as `### N. Name — *Goal tags*` +
description + numbered PR-step list → Mise en place table (if any infra proposed) → footer
`*Reading Weather — product roadmap, <date>*`.

## Breaking a feature into PR steps

Sequence data/logic → UI → wiring, splitting wherever a step could stand alone:

- A pure function (a `+page.server.ts` data helper, a formatter) plus its unit tests is its own
  step.
- New UI (a `.svelte` component/route) is its own step.
- A step needing new human-written content (a blog post, photo captions) gets a GitHub issue via
  `mcp__github__create_issue` rather than a PR, referenced from the roadmap line.
- No feature-flag system exists here — don't propose gating behind flags.
- If a feature is small enough that splitting produces nothing independently reviewable, write
  **"One PR."** instead.

## Notes

- Personal/small project — don't propose enterprise-scale features as "Now"/"Next".
- Don't re-propose anything already tracked as an open item in `AUDIT.md`.
- Never propose "related posts" / "more from this month" / "nearby-in-time" recommendation
  features. Rejected: nobody wants a different day's forecast surfaced next to the current one.
- Do not commit, push, or open a PR for `ROADMAP.md` changes unless the user explicitly asks.
