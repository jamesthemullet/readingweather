# Product Roadmap — Reading Weather

The site already covers posts, photos, seasonal forecasts, records, and a monthly summary — but
these sections don't yet link to each other, so a visitor reading one post has no obvious next
step. Everything below is scored against four jobs:

- **Acquisition** — brings new visitors in
- **Engagement** — deepens a single visit
- **Retention** — earns a repeat visit
- **Fun** — no metric, just delight

Every feature is broken into a **PR sequence** — each step small enough for a human to review in
about 15 minutes. Genuinely atomic changes are left as one PR.

## Now (ship in weeks — reuses existing infra)

### 1. Related posts — *Engagement, Retention*
"More from this month" / "more photos from around this date" links at the bottom of a post, so a
visit doesn't dead-end after one entry.

1. Query: given a post, find nearby-in-time posts/photos — pure function + tests, reusing
   `+page.server.ts`'s existing data-loading pattern.
2. Component rendering the related-content list on `[slug]`.

### 2. Record structured data — *Acquisition, SEO*
Weather-record pages (`records`) are exactly the kind of specific, factual content search
engines like — add structured data so they can surface directly.

1. **One PR.** A single JSON-LD block added to the `records` template from fields that already
   exist.

### 3. Cross-linking gallery ↔ posts ↔ seasonal forecasts — *Engagement*
The `gallery`, `photographs`, `seasonal-forecasts`, and `[slug]` post routes currently don't
reference each other — improving existing pages rather than building new ones.

1. Add a "see the photos from this post" link on `[slug]` pointing into `gallery`/`photographs`
   where a date/tag match exists — pure function (matching logic) + tests, then the link itself.

## Next (this quarter — moderate new build)

### 4. Monthly digest email — *Retention, Acquisition*
A monthly email summarizing the month's posts and weather records — the site's first outbound
channel, reusing `monthly-summary`'s existing data.

1. **Infra (Mise en Place):** pick and wire an email provider — no such package currently in
   `package.json`.
2. Digest content query reusing `monthly-summary`'s data-loading logic — pure function + tests.
3. HTML email template.
4. Scheduled job assembling and sending the digest monthly.
5. Unsubscribe/preference handling.

---
*Reading Weather — product roadmap, 2 September 2026*
