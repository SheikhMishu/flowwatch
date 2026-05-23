# FlowMonix Security Report

**Date:** 2026-05-23  
**Scope:** Full application — auth, API routes, frontend, infrastructure, credentials, dependencies  
**Method:** Manual code inspection of all API routes, middleware, auth library, crypto library, CSP config, and dependency audit

---

## Executive Summary

FlowMonix has a solid security baseline. Sessions are JWT+httpOnly cookies, API keys are AES-256-GCM encrypted, IDOR protection is consistent across routes, and the security headers stack is complete. The system is **safe for real paying customers** with a small number of targeted fixes — none are externally exploitable without authenticated access.

Two issues need fixing before a high-traffic ad campaign: the PIN generation uses a non-cryptographic random source (the primary auth mechanism), and one delete route is missing its org_id guard in the DB query.

---

## Findings

### CRITICAL

None.

---

### HIGH

#### H1 — PIN generated with Math.random() (non-CSPRNG)
**File:** `src/lib/pin.ts:6`  
**Issue:** `Math.floor(100000 + Math.random() * 900000)` — `Math.random()` is not a CSPRNG. V8's PRNG state is seeable/predictable in some server environments and has historically been broken in edge cases.  
**Impact:** An attacker who can observe output or shares a process could narrow the PIN space from 900,000 to a much smaller set, enabling brute-force within the 5-attempt window.  
**Fix:**
```ts
import { randomInt } from "crypto";
export function generatePin(): string {
  return randomInt(100000, 1000000).toString();
}
```

#### H2 — Alerts DELETE query missing org_id filter
**File:** `src/app/api/alerts/[id]/route.ts:95`  
**Issue:** The pre-check (`getAlertForOrg`) correctly validates ownership, but the delete itself is `db.from("alerts").delete().eq("id", id)` with no `.eq("org_id", session.orgId)`. The application-level guard is the only thing preventing cross-tenant deletion.  
**Impact:** If RLS is not enabled on the `alerts` table in Supabase (all server queries bypass RLS via service role key), and if the pre-check logic ever has a flaw (e.g., future refactor), an authenticated user could delete another org's alert.  
**Fix:** Add org filter to the delete:
```ts
db.from("alerts").delete().eq("id", id).eq("org_id", session.orgId)
```

---

### MEDIUM

#### M1 — No rate limiting on AI endpoint
**File:** `src/app/api/ai/explain/route.ts`  
**Issue:** The endpoint enforces a monthly per-org quota but has no per-minute / per-IP rate limiting. An attacker on a Pro plan could fire hundreds of concurrent requests instantly.  
**Impact:** Quota exhaustion in seconds (DoS against their own quota), plus cost amplification since each miss calls Anthropic or OpenRouter.  
**Fix:** Add a sliding-window rate limit (e.g., 10 requests/minute per org) before the quota check.

#### M2 — No rate limiting on contact form
**File:** `src/app/api/contact/route.ts`  
**Issue:** Authenticated users can submit the contact form unlimited times with no throttle.  
**Impact:** Email spam to your support inbox.  
**Fix:** One submission per 60 seconds per userId (same DB-based pattern as PIN send).

#### M3 — CSP script-src includes 'unsafe-inline'
**File:** `next.config.ts:8`  
**Issue:** `script-src 'self' 'unsafe-inline'` — inline scripts are allowed. This significantly weakens XSS protection (any injected inline `<script>` would execute).  
**Impact:** Reduces the blast radius protection of CSP if an XSS vector is ever found.  
**Note:** No `dangerouslySetInnerHTML` usage found in the codebase, and React escapes output by default, so XSS risk is currently low. But the CSP provides no additional layer.  
**Fix:** Use nonces (Next.js 15 supports CSP nonces via middleware). Not trivial but the right long-term fix.

#### M4 — CSP connect-src allows all HTTPS origins
**File:** `next.config.ts:13`  
**Issue:** `connect-src 'self' https:` allows XHR/fetch to any HTTPS host.  
**Impact:** If XSS were achieved, data could be exfiltrated to any attacker-controlled HTTPS endpoint.  
**Fix:** Enumerate specific allowed origins (Supabase URL, Stripe, OpenRouter, Anthropic).

#### M5 — npm audit: 11 vulnerabilities (1 high, 10 moderate)
**Command:** `npm audit`

| Severity | Package | Title | Fix |
|---|---|---|---|
| High | `fast-xml-builder` | XML attribute injection (CWE-91/611) | `npm audit fix` |
| Moderate | `@anthropic-ai/sdk` | Insecure file permissions in FS Memory Tool | Upgrade to `>=0.91.1` |
| Moderate | `ws` | Uninitialized memory disclosure | `npm audit fix` |
| Moderate | `brace-expansion` | Numeric range DoS | `npm audit fix` |
| Moderate | `svix`/`resend` | Depends on vulnerable uuid | `npm audit fix` |

The `fast-xml-builder` high vulnerability is in the AWS SDK used for SES. The XML injection requires attacker-controlled input to reach the XML builder — possible if user-controlled data (email addresses, org names) flows through SES SDK internals. Run `npm audit fix` to resolve all non-breaking fixes now.

#### M6 — RLS not enforced server-side (all queries bypass it)
**File:** `src/lib/db.ts`  
**Issue:** `getServerDb()` uses `SUPABASE_SERVICE_ROLE_KEY`, which bypasses all Supabase Row Level Security policies. Every API route's security depends entirely on application-level `eq("org_id", session.orgId)` filters being present and correct.  
**Impact:** One missing org filter in any route = cross-tenant data access. The H2 finding above is an example of this pattern.  
**Recommendation:** Audit every DB query against the org_id filter checklist. Consider enabling RLS as a defense-in-depth layer even for server-side queries (use anon key + auth header on the server client), or accept this as a deliberate architecture choice and document it clearly.

---

### LOW

#### L1 — create-org endpoint has no session guard
**File:** `src/app/api/auth/create-org/route.ts`  
**Issue:** This route is intentionally unauthenticated (called right after PIN verification before a session exists). It accepts `userId` + `email` from the request body and verifies them against the DB. If an attacker knows an existing user's UUID and email, they could create a second org for that user.  
**Impact:** Low — user UUIDs are not guessable, and the email must match exactly. In practice, not exploitable. But the architecture is weaker than session-protected routes.  
**Note:** The multi-workspace branch uses this same route for creating child workspaces, making this more relevant when that branch ships.

#### L2 — select("*") in alerts PATCH response
**File:** `src/app/api/alerts/[id]/route.ts:64`  
**Issue:** `.select("*")` returns all columns on update. If sensitive columns are added to the alerts table in future, they'd be returned to the client automatically.  
**Fix:** Enumerate columns explicitly.

#### L3 — Invite token leaks org name without auth
**File:** `src/app/api/invites/[token]/route.ts`  
**Issue:** Anyone with a valid invite token can retrieve the org name. This is intentional UX (user needs to see what they're joining), but worth noting as a deliberate information disclosure.  
**Impact:** Negligible in context.

#### L4 — Math.random() for slug deduplication suffix
**File:** `src/app/api/auth/create-org/route.ts:20`  
**Issue:** `Math.random().toString(36).slice(2, 7)` for slug suffix. Not a security issue (slugs are public), but inconsistent with secure randomness elsewhere.

#### L5 — Error stack traces logged to DB
**File:** `src/lib/logger.ts:62`  
**Issue:** `persistToDb` stores `err.stack` in `app_logs.context`. If an error message contains a secret (e.g., n8n response body includes a token, or a mis-formed DB error leaks a query), it would be stored in the DB log table.  
**Observation:** Reviewed the error paths — n8n error messages contain status codes and response bodies (not our API keys), Supabase errors contain query meta (not data). Currently low risk, but worth awareness.

---

## What's Well Done

The following practices are solid and should be maintained:

- **AES-256-GCM with random IV per encrypt** — API keys properly encrypted at rest (`src/lib/crypto.ts`)
- **API keys never returned in responses** — only hint (`••••xxxx`) is exposed
- **httpOnly + Secure + SameSite=Lax cookies** — JWT never touches JavaScript
- **HSTS + X-Frame-Options DENY + nosniff + COOP + CORP** — full security headers stack
- **bcrypt(10) for PIN hashing** — appropriate cost factor
- **PIN brute-force lockout** — 5 attempts then PIN invalidated
- **PIN expiry at 10 minutes**
- **60-second resend rate limit** on send-pin
- **IDOR protection consistent** — every resource lookup includes `.eq("org_id", session.orgId)` (except the H2 delete)
- **Role-based access enforced** — viewer restrictions at route level
- **Demo account fully isolated** — `org_demo` checks in all mutating routes
- **Stripe webhook signature verified** — `constructEvent` with webhook secret
- **Stripe event idempotency** — dedup table prevents double-processing
- **Cron endpoints CRON_SECRET protected** in production
- **No dangerouslySetInnerHTML** found in codebase
- **No localStorage token storage** — all session data in httpOnly cookies

---

## Priority Fix List

| Priority | Issue | Effort |
|---|---|---|
| 1 | H1 — Replace Math.random() with crypto.randomInt() in pin.ts | 5 min |
| 2 | H2 — Add .eq("org_id", session.orgId) to alerts DELETE | 2 min |
| 3 | M5 — Run npm audit fix (non-breaking upgrades) | 10 min |
| 4 | M1 — Rate limit /api/ai/explain (10 req/min per org) | 1 hour |
| 5 | M6 — Full audit of all DB queries for missing org_id filter | 2 hours |
| 6 | M2 — Rate limit /api/contact | 30 min |
| 7 | M3/M4 — Tighten CSP (nonces + specific connect-src) | 4 hours |

---

## Safe for Public Launch Checklist

| Check | Status | Notes |
|---|---|---|
| Auth safe? | **Mostly** | Fix H1 (PIN CSPRNG) first |
| Tenant isolation safe? | **Mostly** | Fix H2 (alerts DELETE) first; M6 needs audit |
| n8n API keys protected? | **Yes** | AES-256-GCM, never returned in responses |
| Secrets protected? | **Yes** | No hardcoded secrets, env vars correctly scoped |
| Rate limiting enabled? | **Partial** | PIN flow yes; AI endpoint and contact form no |
| XSS protected? | **Mostly** | React escaping + headers, but CSP unsafe-inline weakens it |
| Stripe integration safe? | **Yes** | Signature verification + idempotency |
| Production-ready? | **Yes with fixes** | Fix H1 and H2 before launch |

---

## Final Answer

**Would I trust real paying customers on this system today?**

**Yes, with two fixes applied first** (H1 and H2 — ~7 minutes of work combined).

The foundation is sound: proper encryption, bcrypt PINs, IDOR protection, httpOnly cookies, strong headers, and webhook security. The two HIGH issues are real vulnerabilities but neither is trivially exploitable without authenticated access. Fix them before the next ad campaign, run `npm audit fix`, and this is a production-grade system.

The medium issues (rate limiting, CSP tightening) are genuine improvements but not blockers for launch with real paying users.
