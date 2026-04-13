# FlowWatch — Build Tasks

## Auth & Onboarding
- [x] PIN login flow (email → PIN → create org)
- [x] Invite flow (send invite, accept via token)
- [x] Session (JWT cookie, /api/auth/me, logout)
- [x] Demo account (demo@flowwatch.app / 123456)

## Instance Management
- [x] Add / delete instances
- [x] Test connection before saving
- [x] Encrypt API keys (AES-256-GCM)
- [x] Sync button → update last_synced_at

## Dashboard Pages
- [x] /dashboard — stats, chart, failures, incidents widget
- [x] /dashboard/workflows — list, search, filter, stats
- [x] /dashboard/workflows/[id] — detail, execution history
- [x] /dashboard/executions — table, inline detail, node timeline
- [x] /dashboard/executions/[id] — full execution detail
- [x] /dashboard/incidents — real data, status updates, auto-created from alert firings + execution grouping
- [x] /dashboard/analytics — real data (fetchOrgStats + fetchOrgExecutions; mock only for demo)
- [x] /dashboard/alerts — real data (reads/writes alerts DB table; mock only for demo)
- [x] /dashboard/instances — real data, add/disconnect
- [x] /dashboard/settings — profile, team, security tabs

## Alerts
- [x] DB table (002_alerts.sql)
- [x] API routes GET/POST /api/alerts, PATCH/DELETE /api/alerts/[id]
- [x] Create/Edit modal, delete, toggle active
- [x] Alert evaluation + fire — evaluates after every sync, fires email/slack/webhook
- [x] Cooldown enforcement per alert
- [x] Threshold: fail X times in Y minutes condition

## Incidents
- [x] DB table (005_incidents.sql)
- [x] Auto-create from alert firings (alert-engine.ts → upsertIncident)
- [x] Execution-based grouping by error_signature within 15-min window (incident-grouping.ts)
- [x] error_signature generation — normalizes error message, hashes workflow+node+error (error-signature.ts)
- [x] incident_id + error_signature columns on synced_executions (006_incident_grouping.sql)
- [x] Auto-resolve stale incidents (last_seen_at > 30 min → resolved)
- [x] Severity auto-calculated from failure count (low/medium/high/critical)
- [x] GET /api/incidents, PATCH /api/incidents/[id] (manual status update)
- [x] /dashboard/incidents — filter tabs, status update dropdown per card
- [ ] Active incidents surfaced first on /dashboard home widget
- [ ] Frequency label on incident cards ("12 failures in 10 min")
- [ ] Incident auto-refresh (poll every 30s on incidents page)

## Notifications
- [x] /api/notifications — derives from n8n live failures
- [x] Bell icon with unread badge
- [x] Notification panel, mark all read (localStorage)
- [x] Notification polling (setInterval every 60s, update badge without opening panel)

## Settings
- [x] Profile save → PATCH /api/users/me
- [x] Team member remove → DELETE /api/org/members/[id]
- [x] Team member role change → PATCH /api/org/members/[id]

## Analytics Page
- [x] Wire to real n8n data (fetchOrgStats + fetchOrgExecutions)
- [x] 7-day trend, top failing workflows, hourly heatmap

## Billing Page
- [x] /dashboard/billing — current plan, usage, upgrade CTA (UI only)

## Mobile
- [x] Verify + fix mobile nav layout (instance selector on mobile, safe-area-pb, viewport-fit=cover)

## Background Sync
- [x] DB tables: synced_executions, workflow_snapshots (003_sync.sql)
- [x] POST /api/sync/[instanceId] — upsert 250 most recent executions + all workflows
- [x] GET /api/cron/sync — Vercel Cron every 5 min (vercel.json)
- [x] Dashboard reads from Supabase first, falls back to live n8n (n8n-data.ts)
- [x] Instances "Sync Now" button runs full data sync

---

# Next Up — Priority Order

## 1. AI Debugging (biggest differentiator)
- [ ] "Explain with AI" button on execution detail page
- [ ] "Explain with AI" button on incident detail/card
- [ ] Call Claude API with execution error context (failed node, error message, workflow name)
- [ ] Cache AI result on the incident row (reuse, don't re-call for same incident)
- [ ] Show: what happened, why it failed, suggested fix steps
- [ ] Pro feature gate (free tier: teaser/blur, Pro+: full)

## 2. Retry Execution
- [ ] "Retry" button on execution detail page
- [ ] "Retry" button on incident card
- [ ] POST to n8n retry endpoint, show loading/success/fail state
- [ ] Disable button if instance is disconnected

## 3. Incident UX Polish
- [ ] Surface active (open + investigating) incidents at top of /dashboard home widget
- [ ] Frequency label on incident cards ("12 failures in 10 min")
- [ ] Auto-refresh incidents page every 30s (setInterval, no full reload)

## 4. Public Status Page
- [ ] Public route /status/[orgSlug] — no auth required
- [ ] Show: instance health, open incidents, last synced
- [ ] Shareable URL — agencies can send to clients
- [ ] Optional: custom branding (org name/logo)

## 5. Data Retention Cron
- [ ] Cron job: delete synced_executions older than plan limit (Free=7d, Pro=30d, Team=90d)
- [ ] Read org plan from organizations.plan, apply correct window
- [ ] Run as part of /api/cron/sync or separate /api/cron/retention

## 6. Stripe Billing
- [ ] Integrate Stripe Checkout + webhooks
- [ ] Enforce instance limits per plan (Free=1, Pro=5, Team=10)
- [ ] Gate AI debugging behind Pro+
- [ ] Manage subscription from /dashboard/billing
- [ ] Handle upgrade/downgrade/cancellation

## Backlog
- [ ] Weekly digest email (summary of failures, top incidents)
- [ ] On-call rotation (Team feature — who gets paged)
- [ ] Alert snooze / maintenance mode
- [ ] Real-time feel via shorter polling or n8n webhook push
- [ ] Slack OAuth app integration (vs current webhook-only)
