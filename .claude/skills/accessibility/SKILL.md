---
name: accessibility
description: Incrementally improve accessibility for this SvelteKit / TypeScript project. Use when the user invokes /accessibility or asks to fix an accessibility issue, audit WCAG compliance, or improve screen reader support.
disable-model-invocation: true
---

# /accessibility skill

You are running an incremental accessibility improvement session for the ReadingWeather SvelteKit app, targeting WCAG 2.1 AA compliance.

## Stack

- SvelteKit 2.x with SSR — `src/routes/` for pages, `src/lib/components/` for components
- Svelte 5 runes: `$state`, `$props`, `$derived`, `$effect` — prefer these over legacy reactive syntax
- Pure CSS in scoped `<style>` blocks and `src/styles/global.css` — no CSS-in-JS, no Tailwind
- Biome for linting — strict mode
- `accented` library is loaded in development mode (`+layout.svelte`) to highlight missing ARIA attributes
- Source files: `src/lib/components/`, `src/routes/`, `src/styles/global.css`

## What to do each invocation

### Step 1 — Pick a category

Use the current second of the clock (or any arbitrary signal) to pick **one** of these five categories. Vary the selection — do not always pick the same one:

1. **ARIA accuracy** — look for: `aria-required` on inputs that already have the native `required` attribute (redundant), missing `aria-describedby` on form inputs to associate error messages, incorrect `role` values, ARIA attributes on elements that don't support them, `aria-label` text that duplicates visible label text verbatim, empty `aria-label` attributes
2. **Focus management** — look for: keyboard-inaccessible interactive elements (non-button/link elements with click handlers but no `tabindex`), hidden-but-focusable elements (e.g. mobile nav items reachable by keyboard when `max-height: 0` hides them visually — use `visibility: hidden` or `display: none` on the closed state), focus not returned to a trigger after a dynamic UI change (e.g. form collapse/expand), missing `:focus-visible` styles on interactive elements
3. **Color and contrast** — look for: inline `style="color: ..."` attributes that use color as the *only* indicator of meaning (errors shown in red, success in green — also add an icon or text prefix), hardcoded color values in CSS that don't meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text / UI components), missing `prefers-color-scheme` or `prefers-contrast` media query support where it would help
4. **Semantic HTML and landmarks** — look for: incorrect heading hierarchy (skipped levels, multiple `<h1>` per page, headings used for visual sizing rather than structure), interactive content wrapped in `<div>` instead of `<button>` or `<a>`, missing or wrong landmark roles (`<nav>`, `<main>`, `<footer>`, `<article>`), lists used for non-list content or non-list elements inside `<ul>`/`<ol>`
5. **Images and media** — look for: `<img>` without an `alt` attribute, meaningful images with `alt=""` (empty alt is only correct for purely decorative images), images inside `<a>` links where the link has no other text and the image has `alt=""` (the link is then unlabelled), SVGs used as informational icons without a `<title>` element or `aria-label`

### Step 2 — Find the best candidate

Read the relevant source files. Identify the **single clearest, most impactful** issue in the chosen category. Prefer issues that:

- Affect the most frequently visited pages or shared components
- Have a straightforward fix that does not require visual redesign
- Would cause a real barrier for keyboard or screen reader users (not just a best-practice warning)

### Step 3 — Fix it

Make the fix. Keep scope tight — one issue, one or two files. Do not refactor beyond what is needed to address the specific finding. Confirm the fix compiles: `yarn check`.

### Step 4 — Report

Output exactly this structure:

```
## Accessibility improvement

**Category:** <chosen category name>
**WCAG criterion:** <e.g. 1.1.1 Non-text Content (A), 4.1.3 Status Messages (AA)>
**File:** <path:line>
**Issue:** <one sentence describing the problem and who it affects>
**Fix:** <what was changed and why>
**Next suggestion:** <the next candidate worth tackling in this category, with file path>
```

## Known project patterns

- **Existing accessibility baseline:** The project already has a skip link (`+layout.svelte:54`), `aria-current="page"` on active nav links, `aria-expanded` / `aria-controls` on the mobile menu button, and `aria-live` regions on form feedback messages. Do not re-add these.
- **Inline style="color: red/green"**: `AddComment.svelte:73-74` uses inline colour styles on error/success messages. These rely on colour alone — they need a text prefix or icon too (e.g. "Error: " / "Success: "). This project uses scoped CSS `<style>` blocks — move the colour to a CSS class at the same time.
- **Mobile nav keyboard trap**: `NavBar.svelte` hides the nav using `max-height: 0` but does not set `visibility: hidden` on the closed state, so nav links remain keyboard-focusable when visually hidden. Adding `visibility: hidden` to the closed state and `visibility: visible` to the open state fixes this without breaking the CSS transition (use `transition: max-height, visibility`).
- **Redundant `aria-required`**: `AddComment.svelte:59-67` sets both `required` and `aria-required="true"` on inputs. Native `required` is sufficient — `aria-required` on a natively required input is redundant per ARIA spec and should be removed.
- **Subscribe form implicit labels**: `+layout.svelte:69-75` uses `<label>` wrapping the input (implicit association) without `for`/`id`. This works in modern browsers but `for`/`id` explicit association is more robust across assistive technologies. Add matching `for`/`id` pairs.
- **Error message `aria-describedby`**: Form inputs in `AddComment.svelte` do not reference the error message paragraph via `aria-describedby`. Screen readers announce the live region when the message appears, but associating the description to the input provides context when the user focuses the field after an error.
- **`accented` dev tool**: Loaded automatically in development mode (`+layout.svelte:34-38`). It highlights missing accessible names at runtime — if it flags something during development, treat it as an authoritative source and fix the underlying issue rather than adding a suppression.
- **Button global styles**: `global.css` defines `button:focus-visible` with a `3px solid #ffbf47` outline and `input:focus-visible` with the same. Do not remove these — they are the primary keyboard focus indicator for the site.
- **`aria-hidden` SVGs**: All SVGs in the project should carry `aria-hidden="true" focusable="false"`. The hamburger SVG in `NavBar.svelte` already does — apply the same pattern to any SVG added in future.
- **`$lib` path alias**: Internal imports use `$lib/...`, not relative paths.
- **Svelte 5 runes**: New components use `$props()`, `$state()`, `$derived()` — not legacy `export let` or `$:`.
