---
name: tests
description: Incrementally improve test coverage for this repo. Use when the user invokes /tests or asks to improve tests, add a test, or increase test coverage. Chooses between unit tests (Vitest) and e2e tests (Playwright) based on what will deliver the most value.
disable-model-invocation: true
---

# Test Coverage Improvement

## Repo Overview

- **Unit tests**: Vitest — `src/**/*.{test,spec}.{js,ts}` — run with `yarn test:unit --run`
- **E2E tests**: Playwright — `e2e/*.{test,spec}.{js,ts}` — run with `yarn test:e2e`
- **Full suite**: `yarn test` (unit then e2e)
- E2E runs against a built preview server (`yarn build && yarn preview`) on port 4173

## Decision Framework

**Choose unit tests when:**
- There is pure logic with no browser or network dependency (cache TTL, validation regexes, data parsing, error handling branches in server routes)
- A function has multiple branches that are difficult to trigger in e2e
- The logic is the same regardless of UI rendering

**Choose e2e tests when:**
- A user-facing flow involves multiple steps that must work together (form submission, navigation, state changes across page loads)
- The test must verify that something actually *happened* (a form was rejected, a message appeared after a network action, a redirect occurred)
- Unit tests for the same area already exist and the missing coverage is integration of parts

**E2E tests must test functionality, not just visibility.** "Element is visible" is not a functional test — that's a unit/render concern. E2E tests should verify:
- Correct server responses to user actions (form submit succeeds/fails with correct feedback)
- Navigation flows that depend on data loading
- Error states when inputs are invalid
- State changes that persist across interactions (e.g., form resets after success)

## What Is Already Tested

Check current tests before deciding:

Unit tests (Vitest):
- !`find src -name "*.spec.ts" -o -name "*.test.ts" | head -30`

E2E tests (Playwright):
- !`find e2e -name "*.test.ts" -o -name "*.spec.ts" | head -20`

## Untested Areas (Priority Order)

### Unit test candidates

1. **`src/lib/server/cache.ts`** — `getCache` / `setCache`
   - Cache miss returns null
   - Cache hit returns stored data
   - Expired entries return null and are evicted
   - Different keys are independent

2. **`src/routes/api/comment/+server.ts`** — validation logic
   - Missing fields return 400
   - Invalid email format returns 400
   - Invalid base64 post ID returns 400
   - Valid body calls addComment (mock the import)

3. **`src/routes/api/subscribe/+server.ts`** — validation logic
   - Missing name/email returns 400
   - Invalid email format returns 400
   - CSRF origin check returns 403 for non-localhost, non-prod origin

4. **`src/lib/graphql/api.ts`** — `fetchGraphQL`
   - Throws when response.ok is false
   - Throws when json.errors is present
   - Returns json.data on success

### E2E test candidates

1. **Comment form submission** (`/[slug]` post page)
   - Submitting with empty fields shows validation error message
   - Submitting with invalid email shows validation error
   - (If a real post exists) Submitting valid comment shows success feedback and resets form

2. **Newsletter subscription form**
   - Submitting with empty fields shows validation error
   - Submitting with invalid email shows validation error

3. **Navigation**
   - Clicking nav links loads correct pages (title or heading changes, not just "is visible")
   - Archives page loads and lists posts
   - About page loads

4. **Post page** (`/[slug]`)
   - A known slug loads post content (heading, body text)
   - A non-existent slug returns 404 (verify response status or error page)

## Instructions

1. Read the existing test files and the source files for the area you plan to test.
2. Pick the single most valuable addition based on the decision framework above.
3. Write the test — one focused file or one new `describe` block added to an existing file.
4. Run the relevant test suite to confirm the test passes:
   - Unit: `npm run test:unit -- --run`
   - E2E: `npm run test:e2e` (note: requires a full build, takes a few minutes)
5. If the test fails for a fixable reason (wrong import path, test setup needed), fix it and re-run.
6. Report what you added and why you chose it over the alternatives.

**If no improvement is justifiable** (all meaningful areas are already covered, or the only additions would be trivial or redundant), report that clearly with reasoning — do not add tests for the sake of it.
