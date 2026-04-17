# FlowMonix — Technical Reference

Last updated: April 2026

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15.3.9 (App Router), TypeScript |
| Styling | Tailwind CSS, custom design tokens |
| Database | Supabase (PostgreSQL), service role client only |
| Auth | JWT via `jose`, cookie `fw_session`, 7-day TTL |
| Email | Amazon SES (`@aws-sdk/client-ses`) |
| Encryption | AES-256-GCM for n8n API keys (`src/lib/crypto.ts`) |
| Charts | recharts |
| Date utils | date-fns |
| Icons | lucide-react |
| Billing | Stripe (Embedded Checkout, Customer Portal) |
| AI | OpenRouter (free tier) + Anthropic Claude Haiku (pro tier) via `src/lib/ai-debug.ts` |
| Logging | Pino → stdout (Railway) + DB fire-and-forget |
| Deployment | Railway (`https://flowwatch-production-2207.up.railway.app`) |
| Cron | cron-job.org → `GET /api/cron/sync` every 5 min |

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |
| `JWT_SECRET` | Signs/verifies `fw_session` cookie |
| `ENCRYPTION_KEY` | AES-256-GCM key for n8n API key storage |
| `AWS_ACCESS_KEY_ID` | SES credentials |
| `AWS_SECRET_ACCESS_KEY` | SES credentials |
| `AWS_REGION` | SES region |
| `REG_MAIL_FROM` | Sender for auth emails (PIN, invite) |
| `NOTIFY_MAIL_FROM` | Sender for alert/notification emails |
| `NEXT_PUBLIC_APP_URL` | Base URL (used for invite links, status page links, email CTAs) |
| `CRON_SECRET` | Bearer token checked by `/api/cron/sync` |
| `STRIPE_SECRET_KEY` | Stripe server-side key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side key |
| `STRIPE_PRO_PRICE_ID` | Stripe price ID for Pro ($29/mo) |
| `STRIPE_TEAM_PRICE_ID` | Stripe price ID for Team ($99/mo) |
| `OPENROUTER_API_KEY` | OpenRouter (free AI tier) |
| `OPENROUTER_FREE_MODEL` | e.g. `openrouter/free` |
| `ANTHROPIC_API_KEY` | Claude Haiku (pro AI tier) |

---

## Auth Model

- **No passwords.** Login = Signup. One flow for both.
- Flow: email → 6-digit PIN (sent via SES) → JWT session created
- New users also complete a create-org step before reaching dashboard
- Session payload: `{ userId, email, name, orgId, orgName, role: "owner"|"admin"|"viewer" }`
- Cookie: `fw_session` (HttpOnly, 7 days)
- Demo account: `demo@flowmonix.com` / PIN `123456` — orgId is `"org_demo"`, uses mock data, no DB writes
- `isDemo` check: `session.orgId === "org_demo"` — never check `!session`

---

## Tenancy Model

- Every resource scoped to `org_id` — never `user_id`
- Roles: `owner` > `admin` > `viewer`
- Tables: `organizations`, `organization_members`, `organization_invites`

### Role Permissions

| Action | owner | admin | viewer |
|---|---|---|---|
| View all data | yes | yes | yes |
| Retry executions | yes | yes | yes |
| Use AI debug | yes | yes | yes |
| Create/edit/delete alerts | yes | yes | no |
| Add/edit/remove instances | yes | yes | no |
| Invite members | yes | yes | no |
| Change/remove members | yes | yes | no |
| View activity + system logs | yes | yes | no |
| Configure status page | yes | no | no |
| Manage billing | yes | no | no |

Note: `PATCH /api/incidents/[id]` has no role check — viewers can currently update incident status. Known gap.

---

## Database Migrations (run in order in Supabase SQL editor)

| File | Contents |
|---|---|
| `001_init.sql` | users, organizations, org_members, org_invites, n8n_instances |
| `002_alerts.sql` | alerts table |
| `003_sync.sql` | synced_executions, workflow_snapshots |
| `004_alert_firings.sql` | alert_firings log, last_fired_at on alerts |
| `005_incidents.sql` | incidents table (drop+recreate if partial) |
| `006_incident_grouping.sql` | error_signature + incident_id on synced_executions; error_signature + node_name on incidents |
| `007_incidents_last_execution.sql` | last_n8n_execution_id on incidents |
| `008_ai_analyses.sql` | ai_analyses cache table + error_message on incidents + team plan |
| `009_logs.sql` | app_logs + activity_logs tables |
| `010_status_page.sql` | slug + status_page_enabled on organizations |
| `011_billing.sql` | stripe_customer_id, stripe_subscription_id, plan_status, current_period_end on organizations |

### Key Schema Notes
- `n8n_instances.api_key_encrypted` — encrypted column (NOT `api_key_enc`)
- `incidents.assigned_to` — plain uuid, no FK (avoids auth.users vs public.users ambiguity)
- If migration 005 fails with "column org_id does not exist": run `DROP TABLE IF EXISTS incidents;` first

---

## Key File Locations

### Core Libraries
| File | Purpose |
|---|---|
| `src/lib/auth.ts` | `getSession()`, `verifySession()`, `createSession()` |
| `src/lib/db.ts` | `getServerDb()` — Supabase service role client |
| `src/lib/crypto.ts` | AES-256-GCM encrypt/decrypt for n8n API keys |
| `src/lib/email.ts` | SES wrappers + branded HTML templates; `emailLayout()` shared wrapper, `ctaButton()` helper; `sendPinEmail`, `sendInviteEmail`, `sendAlertEmail` |
| `src/lib/n8n.ts` | `N8nClient` class — getWorkflows, getExecutions, getExecutionWithData, retryExecution; `toExecutionNodes()` transform |
| `src/lib/n8n-data.ts` | DB-first reads with live n8n fallback: fetchOrgWorkflows, fetchOrgExecutions, fetchOrgStats |
| `src/lib/sync.ts` | Full sync pipeline: fetch executions → upsert DB → evaluateOrgAlerts → processErrorExecutions → autoResolveIncidents |
| `src/lib/alert-engine.ts` | `evaluateOrgAlerts()` — counts failures, enforces cooldown, fires channels, calls upsertIncident; `buildEmailHtml()` uses shared `emailLayout()` |
| `src/lib/error-signature.ts` | `generateErrorSignature()` — normalizes error, 16-char SHA-256 hex |
| `src/lib/incident-grouping.ts` | `processErrorExecutions()` (15-min window grouping), `autoResolveIncidents()` (30-min threshold) |
| `src/lib/ai-debug.ts` | OpenRouter free path + Claude Haiku pro path; cached in `ai_analyses` table keyed on error_signature + tier |
| `src/lib/stripe.ts` | Lazy Stripe singleton `getStripe()` |
| `src/lib/plans.ts` | `PLAN_LIMITS` record + `getPlanLimits(plan)` — single source of truth for instance caps, retention, member limits |
| `src/lib/retention.ts` | Data retention cleanup logic |
| `src/lib/logger.ts` | Pino logger → stdout + DB fire-and-forget for warn/error/fatal |
| `src/lib/activity.ts` | `logActivity()` — audit trail, always fire-and-forget |
| `src/lib/mock-data.ts` | Demo session mock data |

### Types
- `src/types/index.ts` — all shared types
  - `Incident` has `last_n8n_execution_id: string | null`
  - `ExecutionNode` has `input_items`, `output_items`, `error_description`
  - `Organization` has stripe fields + `plan_status`

### Components
| File | Purpose |
|---|---|
| `src/components/brand/mark.tsx` | `<FlowMonixMark>` SVG component |
| `src/components/dashboard/retry-button.tsx` | `<RetryButton>` — variants "default" and "sm" |
| `src/components/onboarding/` | `OnboardingController`, `WelcomeModal`, `ProductTour` |
| `src/components/layout/sidebar.tsx` | Sidebar nav — includes Help link in bottom group |
| `src/components/layout/mobile-nav.tsx` | Mobile bottom nav — Home, Workflows, Executions, Incidents, Help |
| `src/components/layout/header.tsx` | Instance selector, notifications bell, dark mode, user menu |

### Pages (App Router)
| Route | File |
|---|---|
| `/login` | `src/app/(auth)/login/page.tsx` |
| `/invite/[token]` | `src/app/(auth)/invite/[token]/page.tsx` |
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` |
| `/dashboard/workflows` | `.../workflows/page.tsx` |
| `/dashboard/workflows/[id]` | `.../workflows/[id]/page.tsx` |
| `/dashboard/executions` | `.../executions/page.tsx` + `executions-client.tsx` |
| `/dashboard/executions/[id]` | `.../executions/[id]/page.tsx` |
| `/dashboard/incidents` | `.../incidents/page.tsx` |
| `/dashboard/alerts` | `.../alerts/page.tsx` |
| `/dashboard/analytics` | `.../analytics/page.tsx` |
| `/dashboard/instances` | `.../instances/page.tsx` + `instances-client.tsx` |
| `/dashboard/settings` | `.../settings/page.tsx` + `_components/settings-forms.tsx` |
| `/dashboard/billing` | `.../billing/page.tsx` + `billing-client.tsx` |
| `/dashboard/logs` | `.../logs/page.tsx` |
| `/dashboard/help` | `.../help/page.tsx` + `help-client.tsx` — searchable in-app docs |
| `/status/[slug]` | `src/app/status/[slug]/page.tsx` (public, no auth) |

### API Routes
| Route | Method(s) | Notes |
|---|---|---|
| `/api/auth/send-pin` | POST | Sends 6-digit PIN via SES |
| `/api/auth/verify-pin` | POST | Verifies PIN, creates session; handles invite flow via `inviteToken` param |
| `/api/auth/create-org` | POST | New user org creation |
| `/api/auth/logout` | POST | Clears cookie |
| `/api/auth/me` | GET | Returns session payload |
| `/api/instances` | GET, POST | POST enforces plan instance limit (403 `{ limitReached, currentPlan }`) |
| `/api/instances/[id]` | PATCH, DELETE | viewer blocked |
| `/api/instances/[id]/test` | POST | Empty body = test stored creds; body with url+apiKey = test provided creds |
| `/api/instances/[id]/sync` | POST | Full sync, returns `{ ok, last_synced_at, workflowsUpserted, executionsUpserted }` |
| `/api/executions/[id]` | GET | Returns `{ nodes }` for inline panel lazy load; composite ID = "instanceId:n8nExecutionId" |
| `/api/executions/[id]/retry` | POST | Calls n8n retry endpoint |
| `/api/incidents` | GET | List with filters |
| `/api/incidents/[id]` | PATCH | Update status/assignee — no role check (known gap: viewer can mutate) |
| `/api/incidents/count` | GET | Lightweight COUNT for nav badge |
| `/api/alerts` | GET, POST | POST viewer blocked |
| `/api/alerts/[id]` | PATCH, DELETE | viewer blocked |
| `/api/org/members` | GET | Lists members with user info |
| `/api/org/members/[id]` | PATCH, DELETE | owner+admin only |
| `/api/org/status-page` | GET, PATCH | PATCH owner only |
| `/api/invites/send` | POST | owner+admin only; creates invite + sends email |
| `/api/invites/[token]` | GET | Public (no auth) — validates invite token |
| `/api/ai/explain` | POST | Resolves org plan → picks model |
| `/api/billing/checkout` | POST | owner only; creates Stripe Embedded Checkout session |
| `/api/billing/portal` | POST | owner only; creates Stripe Customer Portal session |
| `/api/billing/webhook` | POST | Stripe signature auth (not JWT); handles checkout.session.completed, subscription events |
| `/api/billing/status` | GET | Returns plan, planStatus, usage, limits |
| `/api/cron/sync` | GET | Bearer `CRON_SECRET`; syncs all orgs |
| `/api/cron/retention` | GET | Daily retention cleanup |
| `/api/logs/activity` | GET | owner+admin only |
| `/api/logs/system` | GET | owner+admin only |
| `/api/status/[slug]` | GET | Public; returns instance health + open incident count |
| `/api/users/me` | PATCH | Update name, refreshes JWT |
| `/api/notifications` | GET | Live poll of recent n8n failed executions (no DB) |

---

## Middleware (`src/middleware.ts`)

Public routes (no JWT required):
- `/login`, `/`
- `/api/auth/*`
- `/api/cron/*`
- `/api/sync/*`
- `/api/status/*`
- `/api/billing/webhook`
- `/api/invites/*`   ← required for invite page to call token validation unauthenticated
- `/invite/*`
- `/status/*`

Everything else requires a valid `fw_session` cookie.

**Bug fixed:** `/api/invites/*` was missing from the public list, causing invite links to fail with "Failed to load invitation" for unauthenticated visitors.

---

## Email System (`src/lib/email.ts`)

### Shared layout
`emailLayout(content, footerNote?)` — wraps any content string in a branded email shell:
- Gradient header (`#6366f1 → #8b5cf6`) with "Flowmonix" wordmark
- White card body
- Grey footer with dashboard + settings links, copyright
- Email-safe: inline styles only, table-based layout for Outlook compatibility

`ctaButton(label, url)` — gradient CTA button, exported for use in alert-engine.ts

### Email templates
| Function | Sender | Subject pattern |
|---|---|---|
| `sendPinEmail(email, pin)` | `REG_MAIL_FROM` | `{pin} is your FlowMonix verification code` |
| `sendInviteEmail(email, orgName, inviterName, inviteUrl)` | `REG_MAIL_FROM` | `{inviterName} invited you to join {orgName} on FlowMonix` |
| `sendAlertEmail(email, subject, html)` | `NOTIFY_MAIL_FROM` | Built in alert-engine.ts |

### Alert email (built in `alert-engine.ts:buildEmailHtml`)
- Alert name + dynamic severity badge (Elevated / High / Critical) with color-coded pill
- Stats row: failures detected vs threshold side-by-side
- Affected workflows table with red dot indicators
- "View incidents" CTA → `/dashboard/incidents`
- Cooldown note with link to manage alerts
- Subject: `[FlowMonix] {alertName}: {count} failures in {minutes}min`

---

## Background Sync Pipeline

1. cron-job.org calls `GET /api/cron/sync` (Bearer auth) every 5 min
2. Iterates all org instances
3. For each instance: fetches executions from n8n → upserts `synced_executions` → fetches full error details for failed runs via parallel `getExecutionWithData`
4. After sync: `evaluateOrgAlerts()` → `processErrorExecutions()` → `autoResolveIncidents()`
5. Alert channels: email (SES), Slack (Block Kit), generic webhook
6. Incident grouping: same `error_signature` within 15-min window = one incident; auto-resolved after 30 min of no new failures
7. Local dev: `scripts/sync-worker.mjs` polls localhost

---

## Billing / Stripe

- `ui_mode: "embedded_page"` (Stripe v22 — NOT `"embedded"`)
- `current_period_end` is on `sub.items.data[0]` (not on `sub` directly)
- `customer_creation` not valid in subscription mode
- `checkout.session.completed` carries `org_id` in metadata → updates plan + stripe IDs in DB
- `customer.subscription.created` intentionally ignored (handled by checkout.session.completed)
- Plan limits enforced at `POST /api/instances` — returns `{ limitReached: true, currentPlan }` on 403

### Plan Limits (from `src/lib/plans.ts`)

| Plan | Instances | Retention | Members | AI Debug | Slack Alerts |
|---|---|---|---|---|---|
| Free | 1 | 7 days | 2 | no | no |
| Pro ($29/mo) | 5 | 30 days | 10 | yes | yes |
| Team ($99/mo) | 10 | 90 days | unlimited | yes | yes |

---

## In-App Help (`/dashboard/help`)

- `src/app/(dashboard)/dashboard/help/page.tsx` — server component, renders `<HelpClient />`
- `src/app/(dashboard)/dashboard/help/help-client.tsx` — client component
- 13 sections, 35 articles covering all features
- Live search: scores articles by title (3pts), tags (2pts), body (1pt); auto-opens matching sections
- First-occurrence highlight of search term in article body
- Help link in sidebar (bottom group) and mobile nav (replaces Settings slot)
- Support email footer: support@flowmonix.com

**Parser gotcha:** Do NOT use Unicode box-drawing characters (`─`) in comments in this file. SWC (Next.js 15) misparses them and reports "Unexpected token div" far from the actual line. Use plain `---` instead.

---

## Onboarding Flow

Triggered by `?welcome=1` on first login (set in verify-pin route).

State machine in `OnboardingController` (in dashboard layout):
1. `WelcomeModal` — prompts user to connect first instance inline
2. `ProductTour` — 5-step spotlight tour using box-shadow overlay technique

---

## Design System Tokens

- **Backgrounds:** `bg-card`, `bg-background`, `bg-secondary`, `bg-accent`, `bg-muted`
- **Text:** `text-foreground`, `text-muted-foreground`, `text-primary`, `text-success`, `text-destructive`, `text-warning`
- **Border/Shadow:** `border-border`, `shadow-card`, `shadow-card-hover`, `shadow-elevated`
- **Animations:** `animate-fade-in`, `animate-slide-in`, `animate-pulse-dot`, `animate-shimmer`, `animate-shake`
- **Card pattern:** `rounded-xl border border-border bg-card shadow-card p-5`
- **Gradient:** `gradient-primary` CSS class = indigo-violet (135deg, #818CF8 to #A78BFA)

---

## Branding

- **Product name:** FlowMonix (domain: flowmonix.com)
- **Mark:** `<FlowMonixMark>` in `src/components/brand/mark.tsx` — 3-node SVG (paths only, needs gradient container)
- **Wordmark:** "Flow" = foreground/white, "monix" = gradient #818CF8 to #A78BFA
- **Email wordmark:** "Flow" white, "monix" white/70 on gradient background (inline styles, no SVG)
- **Assets:** `public/favicon.svg`, `public/logo.svg`, `brand/flowmonix-brand.txt`

---

## Planned Architecture (not yet built)

- `flowmonix.com` — public marketing/landing page (separate project)
- `app.flowmonix.com` — the app (current Railway deployment)
- `docs.flowmonix.com` — full docs site (future, when content volume justifies it)
- In-app `/dashboard/help` bridges the gap until docs.flowmonix.com is ready

---

## Known Gotchas

- If `ENCRYPTION_KEY` changes, old encrypted n8n API keys cannot be decrypted — user must re-enter via Edit modal
- Supabase Table Editor may show 0 rows with RLS ON — use service role or debug endpoint
- `workflowsUpserted` / `executionsUpserted` in sync result = input array lengths, not DB-confirmed counts
- `incidents.assigned_to` has no FK guard — viewer can currently PATCH incident status (gap in RBAC)
- Railway start command: `next start -H 0.0.0.0 -p ${PORT:-3000}` (Railway injects PORT=8080)
- Do not use Unicode box-drawing chars in `help-client.tsx` — SWC parser bug in Next.js 15
