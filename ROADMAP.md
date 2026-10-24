# Product Roadmap — Reading Weather

The site already covers posts, photos, seasonal forecasts, records, and a monthly summary — but
these sections don't yet link to each other, so a visitor reading one post has no obvious next
step. Everything below is scored against four jobs:

- **Acquisition** — brings new visitors in
- **Engagement** — deepens a single visit
- **Retention** — earns a repeat visit
- **Fun** — no metric, just delight

Every feature is broken into a **PR sequence** — each step small enough for a human to review in
about 15 minutes. Genuinely atomic changes are left as one PR. Tick a step off once its PR merges.

## Now (ship in weeks — reuses existing infra)

### 1. Record structured data — *Acquisition, SEO*
Weather-record pages (`records`) are exactly the kind of specific, factual content search
engines like — add structured data so they can surface directly.

- [x] **One PR.** A single JSON-LD block added to the `records` template from fields that already
  exist.

### 2. Cross-linking gallery ↔ posts ↔ seasonal forecasts — *Engagement*
The `gallery`, `photographs`, `seasonal-forecasts`, and `[slug]` post routes currently don't
reference each other — improving existing pages rather than building new ones.

- [ ] Add a "see the photos from this post" link on `[slug]` pointing into `gallery`/`photographs`
  where a date/tag match exists — pure function (matching logic) + tests, then the link itself.

---
*Reading Weather — product roadmap, 9 September 2026*
