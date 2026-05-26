# FlowMonix — Project Reference

## Stack
- **App:** Next.js 15 (App Router), TypeScript, Tailwind, Shadcn/ui, Supabase, Railway
- **Landing:** Next.js 15 in `landing/` subdirectory, deployed as a separate Railway service
- **DB:** Supabase (Postgres); migrations in `supabase/migrations/`
- **Auth:** Custom PIN-based email auth (no OAuth)

## Hosting — Railway (not Vercel)
Both services deploy on Railway via Nixpacks + `next start`. There is a stale `vercel.json` at repo root — ignore it.

Security headers go in `next.config.ts` via the `headers()` function (not `vercel.json`).

Railway config (`railway.toml`):
```toml
[build]
buildCommand = "NODE_OPTIONS=--max-old-space-size=2048 npm run build"

[deploy]
startCommand = "NODE_OPTIONS=--max-old-space-size=1024 npm start"
```

## Email Infrastructure
- **Sending:** AWS SES. Env var: `REG_MAIL_FROM` on the landing Railway service; `NOTIFY_MAIL_FROM` on the app Railway service.
- **Receiving:** Cloudflare Email Routing → sheikh.mishu.au@gmail.com
- **Active addresses:** info@, hello@, notification@, registration@, support@flowmonix.com
- **DNS:** SPF + DKIM (SES) + DMARC (p=quarantine) + BIMI all configured in Cloudflare
- **New signup notification:** `sendNewSignupNotification()` in `src/lib/email.ts` — fires fire-and-forget from `create-org` route. Sends to `ADMIN_NOTIFY_EMAIL` env var (defaults to `support@flowmonix.com`).

## Analytics & Tracking (landing only)
The main app (`src/`) has NO analytics scripts. Only `landing/` is tracked.

| Tool | ID | Notes |
|---|---|---|
| Google Analytics 4 | `G-LGJ8543ZP2` | Two Script tags in landing/src/app/layout.tsx |
| Microsoft Clarity | `wkmrzvenzm` | Script in landing/src/app/layout.tsx |
| Meta Pixel | `942346332108194` | Script in layout.tsx body (afterInteractive, NOT head) |

**CSP domains required in `landing/next.config.ts`:**
- Clarity: `script-src https://www.clarity.ms https://scripts.clarity.ms` + `connect-src https://www.clarity.ms https://h.clarity.ms`
- GA4: `script-src https://www.googletagmanager.com` + `connect-src https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://region1.analytics.google.com`
- Meta Pixel: `script-src https://connect.facebook.net` + `connect-src https://www.facebook.com https://connect.facebook.net`

**Meta Pixel events:** PageView fires on every landing page load. CompleteRegistration fires in `landing/src/components/signup-form.tsx` after successful signup. Ad blocker errors on fbevents.js are expected and harmless.

**Visitor tracking middleware** fires POST to `app.flowmonix.com/api/track` on every page visit. Exists in BOTH `src/middleware.ts` (app) and `landing/src/middleware.ts` (landing). Keep them in sync. Both send a `source` field (`"app"` or `"landing"`) so visits can be separated in admin analytics.

**`?notrack` opt-out:** Visit any page with `?notrack` to set `fm_notrack` cookie (1 year) and exclude your own browser from tracking.

## Brand Assets
Located in `brand/assets/`. Two sets:
- **v1** (icon-forward): `logo-mark.svg`, `logo-dark.svg`, `logo-light.svg`, `fb-profile.svg`, `fb-cover.svg`
- **v2** (name-forward, "FlowMonix" visible in all): `v2-logo-mark.svg`, `v2-logo-dark.svg`, `v2-logo-light.svg`, `v2-fb-profile.svg`, `v2-fb-cover.svg`

Brand rules: "Flow" bold / "monix" regular with gradient `#818CF8→#A78BFA`. Icon always LEFT of wordmark. Mark gradient: `#5B4FE8→#7B5FED` at 135°.

## Admin Panel Patterns
When adding new admin pages:
- **Padding:** `p-4 sm:p-6 lg:p-8`
- **Tables:** wrap in `<div className="overflow-x-auto"><table className="min-w-[Npx]">`
- **Headers:** stack on mobile with `flex-col sm:flex-row`
- **Datetimes:** use `fmtMelb()` / `distanceMelb()` from `@/lib/dates` (never raw `format()`)
- **Dark theme:** automatically applied — `dark` class is on the admin layout root in `admin-layout-client.tsx`
- **Access control:** check `is_super_admin` on `users` table via DB query on each page; redirect to `/dashboard` if false
- **Admin link in sidebar:** dashboard layout (`src/app/(dashboard)/layout.tsx`) queries `is_super_admin` and passes `isAdmin` prop to `<Sidebar>`. Link only appears for super admins.
- **Aggregates must use RPCs:** never fetch raw rows with `limit(N)` and aggregate in JS — high traffic silently truncates data. Write a Supabase RPC function that aggregates in SQL and returns only the rows needed. See migrations 029/030 for examples.

## API Rate Limiting
Use `checkRateLimit(key, maxRequests, windowMs)` from `@/lib/rate-limit` on any route that could be abused.
- Fixed-window, in-memory (single Railway instance only)
- Key naming: `ai:{orgId}`, `contact:{userId}` — prefix by feature, suffix by the appropriate scope
- Current limits: `/api/ai/explain` → 10/min per org; `/api/contact` → 5/hr per user
- Returns 429 + `Retry-After` header when exceeded

## n8n Sync — API Gotcha
The n8n API cursor pagination uses `cursor` query param + `nextCursor` response field.
Do NOT use `lastId` param — it doesn't exist and returns 400. Confirmed via n8n OpenAPI spec.

## Blog
Posts live in `landing/blog/`. Check `landing/blog/README.md` before writing new posts — it tracks what's published and what topics are already covered.

## Pre-Launch Checklist (run before every ad campaign)
1. Sign up with real email → PIN arrives → org created → dashboard loads
2. Go to /dashboard/billing → click Upgrade to Pro → Stripe modal opens
3. Use test card `4242 4242 4242 4242` → payment completes → redirected with `?checkout=success`
4. Refresh → plan shows Pro (not Free)
5. Check Stripe Dashboard → Webhooks → event shows as delivered (green)
6. Connect n8n instance → sync → workflows appear
7. Open DevTools console on billing page — zero errors

## What's Still Missing (as of 2026-05-19)
- No E2E test suite — signup → billing → dashboard flow still untested programmatically

## Admin Panel — Overview Sections (as of 2026-05-19)
All previously known issues are fixed. Current overview sections:
- Row 1: Organizations, Total Users, Monthly Revenue, Infrastructure
- Row 2: AI Calls (total + this month via RPC), Alert Firings, Landing Signups
- Plan Distribution bar
- Signup Funnel: Landing Signups → Registered Users → Paying Orgs
- Subscription Health: Canceled / Canceling / Past Due counts
- Activation: Active orgs (connected n8n) vs Ghost orgs
- Recent Signups: last 8 orgs with owner email, plan, timestamp

## Admin Panel — RPC Pattern (migrations 029–032)
All aggregates use server-side RPCs. Key RPCs:
- `admin_ai_usage_summary()` → `{total, this_month}`
- `admin_plan_breakdown()` → `{free, pro, team, enterprise}`
- `admin_recent_orgs(p_limit)` → org list with owner email
- `admin_churn_stats()` → `{canceled, canceling, past_due}`
- `admin_active_ghost_stats()` → `{active_orgs, ghost_orgs}`
- `admin_unique_visitors(p_source, p_since, p_excluded_ips)` → `{count}` distinct IPs
- `admin_unique_app_users(p_since, p_excluded_ips)` → `{count}` distinct user_ids
- `admin_top_referrers` returns raw URLs; `page.tsx` groups by hostname, filters out `*.flowmonix.com` (internal noise), and prepends a `direct` entry (null-referrer count queried separately via `.is("referrer", null)`)
