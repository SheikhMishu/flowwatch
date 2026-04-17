# FlowMonix — Feature List

Last updated: April 2026

FlowMonix is an Automation Observability Platform for n8n. It gives individuals and agencies a real-time dashboard to monitor workflow health, catch failures instantly, debug errors with AI, and collaborate with their team — without building anything themselves.

---

## Core Features

### Real-Time Dashboard
- At-a-glance overview of all connected n8n instances
- Live workflow health status (success rate, failure count, last sync time)
- Recent failures feed with error messages
- Open incident count badge in navigation
- Auto-refresh toggle with countdown timer (persists to localStorage)

### Workflow Monitoring
- Full list of all workflows across all connected instances
- Per-workflow execution history with status, duration, trigger type
- Success/failure rates per workflow
- Last run time display

### Retry from UI
- One-click retry directly from incident cards (when execution ID is available)
- No need to open n8n — identify, understand, and re-run from FlowMonix
- Available to Viewer role (read + retry, no edit access)

### Execution Tracking
- Full execution list with inline expand panel (no page navigation needed)
- Error rows: lazy-loads node timeline on expand — shows condensed failure context (2 nodes before the failed node + the failed node itself)
- Success rows: shows duration, trigger, finished time
- Full execution detail page: node-by-node timeline with types, durations, output item counts
- Error detail: error type, failed node, node type, error message, error description, input data to failed node (scrollable JSON)
- "Analyze with AI" shortcut on error rows

### Incident Management
- Incidents auto-created when alerts fire or when sync detects repeated failures with the same error signature
- Grouping: same error pattern within a 15-minute window = one incident (not spam)
- Auto-resolved after 30 minutes of no new failures
- Status tracking: Open → Investigating → Resolved
- Assignee field per incident
- Failure frequency label ("X failures in Y min")
- Retry button on incident cards (when execution ID is available)
- Filter tabs by status, auto-refresh every 30 seconds
- Open incident count badge in sidebar and mobile nav

### Alerts
- User-configured rules: trigger when a workflow fails N times within Y minutes
- Alert channels: Email, Slack (Block Kit formatted), generic webhook
- Per-alert cooldown to prevent notification spam
- Alert rule limits enforced per plan (Free: 2 rules, Pro: 20 rules, Team: unlimited)
- Viewer role cannot create, edit, or delete alerts

### AI Debugging
- One-click AI explanation on any failed execution or incident
- Pro tier: structured output — root cause, fix steps, prevention recommendations (100 AI requests/month)
- Team tier: same structured output with higher limits (500 AI requests/month)
- Free tier: no AI debugging (upgrade prompt shown)
- Results cached per unique error signature (no repeated API calls for the same error)

### n8n Instance Management
- Connect multiple n8n instances (cloud or self-hosted)
- API key stored encrypted (AES-256-GCM)
- Test connection before saving
- Edit instance name, URL, or API key at any time
- Manual "Sync Now" with inline result display
- Disconnect instance with confirmation modal
- Background sync every 5 minutes via cron

### Notification Bell
- Live feed of recent failed executions across all instances
- Polls n8n directly (no DB dependency)
- Unread count badge, auto-updates every 60 seconds

### Analytics
- Execution volume over time (chart)
- Success vs failure breakdown
- Per-instance filtering via instance selector

---

## Team & Collaboration

### Roles
- **Owner** — full access including billing and status page management
- **Admin** — can invite members, manage instances, create alerts; cannot touch billing
- **Viewer** — read-only; can view everything and retry executions but cannot make changes

### Team Management (Settings > Team)
- See all workspace members with roles and join dates
- Change a member's role (owner/admin only)
- Remove a member (owner/admin only)

### Invitations
- Invite anyone by email with a chosen role (admin or viewer)
- Invite link sent via branded email, valid for 7 days
- Invitee completes PIN verification on the invite page before joining
- Duplicate invite and existing-member checks prevent spam

---

## Workspace & Settings

### Profile
- Update display name (refreshes JWT in place, no re-login needed)

### Security
- PIN-based auth — no passwords to manage or leak
- Sessions expire after 7 days
- Logout from any device

### Public Status Page
- Toggle on/off per workspace (owner only)
- Custom slug (e.g. `flowmonix.com/status/your-company`)
- Shows instance health (Operational / Degraded / Issue / Unknown) based on last sync time
- Shows open incident count
- Auto-refreshes every 60 seconds
- "Powered by FlowMonix" footer
- No login required to view

---

## Billing

### Plans

| | Free | Pro | Team |
|---|---|---|---|
| Price | $0 | $29/mo | $99/mo |
| n8n Instances | 1 | 5 | 10 |
| Data Retention | 7 days | 30 days | 90 days |
| Team Members | 2 | 10 | Unlimited |
| AI Debugging | no | yes | yes |
| AI Requests / month | — | 100 | 500 |
| Alert Rules | 2 | 20 | Unlimited |
| Slack Alerts | no | yes | yes |
| Webhook Alerts | yes | yes | yes |
| Email Alerts | yes | yes | yes |
| Status Page | yes | yes | yes |

### Billing Management
- Upgrade via Stripe Embedded Checkout (stays in-app, no redirect)
- Manage subscription, update payment, cancel via Stripe Customer Portal
- Plan limits enforced at the API level (adding an instance beyond plan limit is blocked)
- Owner-only action

---

## Onboarding

- New users land on a guided welcome modal prompting them to connect their first n8n instance
- 5-step interactive product tour (spotlight overlay) explains key sections
- Demo mode available with `demo@flowmonix.com` — full UI with mock data, no signup required

---

## Observability & Logs (Owner/Admin only)

### Activity Log
- Audit trail of all workspace actions (who did what, when)
- Filterable by action type

### System Errors Log
- Internal application errors logged with context
- Useful for diagnosing sync failures or alert delivery issues

---

## Branded Email Notifications

All emails share a consistent branded layout:
- Gradient header (indigo to violet) with FlowMonix wordmark
- White content card with clean typography
- Grey footer with dashboard link, account settings link, copyright
- Email-safe HTML (inline styles, table layout for Outlook)

### Email types sent

| Trigger | Template |
|---|---|
| Login / signup | PIN verification code with styled code box |
| Team invite | Inviter name, workspace name card, gradient Accept button |
| Alert fires | Alert name + severity badge, failures vs threshold stats, affected workflows table, View Incidents CTA |

### Alert email details
- Severity badge: Elevated / High / Critical — color-coded (indigo / amber / red)
- Side-by-side stats: failures detected vs configured threshold
- Affected workflows listed with red dot indicators
- Cooldown reminder + link to manage alerts
- Subject format: `[FlowMonix] Alert Name: 7 failures in 5min`

### Slack alert
- Block Kit formatted messages
- Includes workflow name, instance, failure count, threshold, and link

---

## In-App Help & Documentation (`/dashboard/help`)

- Searchable documentation page accessible from sidebar and mobile nav
- 13 sections, 35 articles covering every feature
- Live search with score-based ranking (title > tags > body)
- Sections and articles auto-open when search matches
- Accordion layout — no page navigation needed
- Support email footer: support@flowmonix.com
- Topics covered: Getting Started, Instances, Workflows, Executions, Incidents, Alerts, AI Debugging, Team & Roles, Status Page, Billing, Security & Privacy, Logs, Analytics

---

## Data & Privacy

- All n8n API keys stored encrypted at rest (AES-256-GCM)
- All data scoped to your workspace — no cross-tenant access
- Data retention enforced per plan (automatic daily cleanup)
- No access to workflow logic or credentials beyond what the n8n API exposes

---

## What's Planned Next

1. **Landing page** — flowmonix.com public marketing site (separate project; app moves to app.flowmonix.com)
2. **Enterprise tier** — SSO, white-label, audit log export, custom retention
3. **docs.flowmonix.com** — full docs site (when content volume justifies splitting from in-app help)
4. **Weekly Email Report** — automated weekly summary per workspace: total executions, success rate, failures resolved, incidents opened/closed. Retention hook — keeps users engaged even when nothing breaks.
5. **Maintenance Mode / Snooze Alerts** — snooze alert rules for X minutes (e.g. during deployments). Prevents alert fatigue and reduces churn from over-notification.
