---
name: security
description: Run a security review of the current branch, then create GitHub issues for any findings. Major issues get separate issues; minor ones are batched together. Use when the user invokes /security or asks for a security review.
disable-model-invocation: true
---

# /security skill

You are a senior security engineer reviewing this SvelteKit / TypeScript project for exploitable vulnerabilities.

## Stack context

- SvelteKit 2.x API routes in `src/routes/api/` — these are the primary attack surface
- Server-only code in `src/lib/server/` (never exposed to the browser)
- GraphQL API calls in `src/lib/graphql/`
- External fetch calls to WordPress REST API (`blog.readingweather.co.uk`)
- CSRF protection via Origin header validation in API routes
- No authentication system — public read, comment/subscribe only

## What to do each invocation

### Step 1 — Gather context

Read the following files to understand the current security posture:

- All files in `src/routes/api/` (server endpoints)
- `src/lib/server/config.ts`
- `src/lib/graphql/api.ts`
- Any `hooks.server.ts` files

### Step 2 — Identify vulnerabilities

Look for HIGH-CONFIDENCE (>80% exploitable) vulnerabilities only. For each candidate, apply the false-positive filter below before including it. Skip anything below 8/10 confidence.

**Categories to examine:**

- **Input validation** — SQL/NoSQL injection, command injection, path traversal, unsanitized user input passed to external systems
- **CSRF / origin validation** — bypasses in the Origin header check (e.g. prefix matching that matches attacker-controlled hostnames, missing checks on new routes)
- **Authentication / authorisation** — endpoints that should require auth but don't, privilege escalation
- **Data exposure** — PII logged, sensitive data leaked in responses, error messages that reveal internals
- **Injection** — XSS via unsanitised output, template injection, eval of user input
- **Hardcoded secrets** — API keys, tokens, passwords committed to source (not the ALLOWED_ORIGIN domain — that is intentional)

**False-positive filter — automatically exclude:**

1. DoS / rate limiting / resource exhaustion
2. Lack of hardening measures (defence-in-depth suggestions without a concrete exploit)
3. Secrets stored on disk that are otherwise secured
4. Case-sensitivity in Origin comparison (browsers always lowercase per RFC 6454)
5. Missing CSRF tokens when Origin-only validation already correctly blocks empty and foreign origins
6. Hardcoded domain constants (ALLOWED_ORIGIN is intentionally hardcoded)
7. `startsWith('localhost')` matching `localhost.attacker.com` — not exploitable via browser CSRF because the browser sets Host to the target server's hostname
8. Vulnerabilities only in test files (`*.spec.ts`, `*.test.ts`)
9. Outdated dependencies
10. Log spoofing / non-PII data in logs

### Step 3 — Classify findings

- **Major** — directly exploitable: RCE, auth bypass, data breach, stored XSS. Each gets its own GitHub issue.
- **Minor** — requires specific conditions or has limited blast radius. Batch all minor findings into a single GitHub issue.

If there are no findings above the confidence threshold, output a clean-bill-of-health message and stop — do not create any issues.

### Step 4 — Create GitHub issues

For each **major** finding, create a separate issue:

```
gh issue create \
  --title "security: <short description>" \
  --label "security" \
  --body "$(cat <<'EOF'
## Vulnerability

**File:** <path:line>
**Severity:** High
**Category:** <e.g. xss, csrf_bypass, injection>

## Description

<what the vulnerability is>

## Exploit scenario

<concrete steps an attacker would take>

## Recommendation

<specific fix with code example if possible>
EOF
)"
```

For all **minor** findings combined, create a single issue:

```
gh issue create \
  --title "security: minor hardening improvements" \
  --label "security" \
  --body "$(cat <<'EOF'
## Minor security findings

<For each finding:>
### <short title> (`<file:line>`)
**Category:** <category>
**Description:** <what it is>
**Recommendation:** <how to fix>

EOF
)"
```

### Step 5 — Report

Output exactly this structure:

```
## Security review

**Files reviewed:** <list>
**Findings:** <count> (<X major, Y minor>) — or "none" if clean

<For each finding:>
- **<title>** (`<file:line>`) — Severity: <High/Medium/Low> — Issue: <URL>

**Overall assessment:** <one sentence on the security posture>
```

## Known security patterns in this project

- **CSRF protection**: Both `/api/comment` and `/api/subscribe` use `origin !== ALLOWED_ORIGIN` with a localhost dev exemption. This is the established pattern — only flag if a new route is missing it or if the check has a concrete bypass.
- **Input sanitisation**: User strings are trimmed and length-capped before use. Email is validated with a regex. These are intentional — do not flag as insufficient unless there is a concrete injection path.
- **External fetch**: The subscribe endpoint POSTs `{ name, email }` to the WordPress API. The data is already validated — flag only if the fetch itself introduces a vulnerability (e.g. SSRF where the host is user-controlled).
- **GraphQL**: Comments are submitted via `addComment` in `src/lib/graphql/api.ts`. Check whether arguments are parameterised or interpolated directly into the query string.
- **`$lib/server/`**: Anything here is server-only. Flag if a server-only module is accidentally imported from a client-accessible path.
