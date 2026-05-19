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
- **Sending:** AWS SES. Env var: `REG_MAIL_FROM` on the landing Railway service.
- **Receiving:** Cloudflare Email Routing → sheikh.mishu.au@gmail.com
- **Active addresses:** info@, hello@, notification@, registration@, support@flowmonix.com
- **DNS:** SPF + DKIM (SES) + DMARC (p=quarantine) + BIMI all configured in Cloudflare

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

## Admin Panel — Known Issues & Planned Work
- `aiCallsToday` in overview is hardcoded to `0` — never fetched
- `planData` and `aiData` in overview use `limit(10000)` raw fetches — need RPCs (same fix as visitor analytics)
- No signup funnel view: landing signups → registered → paid (conversion rate not visible)
- No recent signups feed (newest users/orgs with timestamps)
- No churn/downgrade tracking (Pro → Free cancellations)
- No active vs ghost org classification (signed up but never connected n8n)
