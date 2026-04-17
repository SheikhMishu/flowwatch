# FlowMonix — Product Roadmap

### Know exactly what broke in your automations — instantly.

> **Automation Observability for n8n Teams**
> FlowMonix gives agencies and developers a real-time command center for their n8n workflows — monitoring health, surfacing failures, grouping incidents, and explaining errors with AI. No self-hosting. No Grafana dashboards. Just clarity.

---

## Core Value Loop

1. Workflow fails
2. FlowMonix detects it within 5 minutes
3. Groups related errors into a single incident
4. AI explains the root cause — what broke and why
5. User retries the execution in one click

**→ Resolution in under 30 seconds, without leaving FlowMonix.**

---

## Why Users Stay

- **Always-on monitoring** — silent failures become visible the moment they happen
- **Alerting system** — teams cannot miss failures; Slack, email, or webhook on every trigger
- **Historical execution + incident data** — retention gives teams a searchable failure record over time
- **Multi-instance visibility** — agencies manage all client n8n instances from one dashboard
- **AI explanations, cached** — analyses accumulate over time; the same error never costs a second lookup

---

## Pricing Tiers

| Tier | Price | Instances | Retention | Alert Rules | AI Requests/mo | Team Members | Target |
|------|-------|-----------|-----------|-------------|----------------|--------------|--------|
| **Free** | $0/mo | 1 | 7 days | 3 | 20 | 1 | Indie developers, hobbyists |
| **Pro** | $29/mo | 5 | 30 days | 20 | 200 | 5 | Freelancers, small teams |
| **Team** | $99/mo | 10 | 90 days | Unlimited | Unlimited | 25 | Agencies managing multiple clients |
| **Enterprise** | Custom | Unlimited | Custom | Unlimited | Unlimited | Unlimited | Large orgs, white-label partners |

---

## Now — Shipped

### Core Platform
- **PIN-based authentication** — passwordless login via 6-digit email PIN; no OAuth dependencies
- **Multi-instance management** — connect multiple n8n instances per org; test, sync, and disconnect per instance
- **Background sync** — cron-driven every 5 minutes; pulls workflows and executions into FlowMonix DB
- **Instance health dashboard** — at-a-glance status across all connected instances

### Workflows & Executions
- **Workflow list** — status, last run, success rate per workflow *(All tiers)*
- **Execution history** — filterable log with status, duration, trigger type *(All tiers)*
- **Inline execution panel** — expand any row to see error details and node timeline without leaving the list
- **Execution detail page** — full node-by-node breakdown: node type, duration, input items, output items, error message + description

### Incidents
- **Automatic incident grouping** — errors with the same signature within a 15-minute window are merged into one incident *(Pro+)*
- **Incident lifecycle** — open → investigating → resolved; auto-resolves after 30 minutes of silence
- **Retry from UI** — re-trigger any failed execution directly from the incident card or execution detail; no n8n access required *(All tiers)*
- **Incident frequency labels** — "X failures in Y min" context on every incident card

### Alerts
- **Configurable alert rules** — trigger on N failures within Y minutes per workflow *(All tiers)*
- **Email alerts** — delivered via Amazon SES *(All tiers)*
- **Slack alerts** — Block Kit formatted messages *(Pro+)*
- **Webhook alerts** — POST to any endpoint *(Pro+)*
- **Cooldown enforcement** — prevents alert spam during sustained outages

### AI Debugging
- **Free-tier AI explain** — OpenRouter free model; explains error cause with an upgrade nudge *(Free)*
- **Pro AI debugging** — structured root cause, fix steps, and prevention advice via Claude *(Pro+)*
- **Analysis caching** — results cached by error signature; same error doesn't re-query the model

### Observability & Logs
- **Activity feed** — audit trail of all user and system actions, filterable by type *(Owner/Admin)*
- **System error log** — structured error log from sync, alert engine, and AI calls *(Owner/Admin)*
- **Notification bell** — live feed of recent failures from n8n, independent of sync cycle

### Team & Org
- **Role-based access** — Owner, Admin, Viewer roles per org *(All tiers)*
- **Team invite flow** — email invite with token-based onboarding; invitee completes PIN setup inline
- **Profile management** — name update, session management

### Platform
- **Dark mode** — full theme support across all pages
- **Auto-refresh toggle** — 5-minute page refresh with countdown timer, persisted per user
- **Demo mode** — `demo@flowmonix.com` with mock data; no DB writes, shareable with prospects

---

## Next — In Progress (Q2 2025)

### Public Status Page *(Pro+)*
Each org gets a public-facing URL (`flowmonix.com/status/[orgSlug]`) showing:
- Live instance health
- Open incidents (without internal details)
- Uptime summary

Designed for agencies to share with clients as a trust signal.

### Data Retention Enforcement
- Automated deletion of synced executions older than plan limit (Free=7d, Pro=30d, Team=90d)
- Keeps DB lean; enforces tier value proposition

### Stripe Billing *(billing UI already built)*
- Subscription management via Stripe
- Plan enforcement: instance limits, retention gating, AI feature gating
- Upgrade prompts wired to real checkout

---

## Future — Planned (Q3–Q4 2025)

### On-Call Scheduling *(Team+)*
Assign team members to on-call rotations. Alerts route to the active on-call person. Escalation if no acknowledgment within N minutes.

### Scheduled Reports *(Team+)*
Weekly or daily email digest per org — top failing workflows, MTTR, incident count, resolution rate.

### SSO / SAML *(Enterprise)*
Single sign-on via SAML 2.0 or OIDC. Required for enterprise procurement.

### White-Label *(Enterprise)*
Custom domain, logo, and color scheme. Agencies can resell FlowMonix under their own brand.

### Audit Logs *(Enterprise)*
Immutable, exportable audit trail for compliance use cases (SOC 2, ISO 27001 readiness).

### Multi-User Incident Management *(Team+)*
- Assign incidents to team members
- Internal comments and status thread per incident
- Slack-native acknowledgment

### AI Anomaly Detection *(Pro+)*
Move beyond reactive alerts — FlowMonix learns baseline execution patterns per workflow and flags statistical anomalies before they become incidents.

---

## Why Now

n8n has **200,000+ users growing 10x year-over-year**. The ecosystem has no polished SaaS monitoring layer — teams are piecing together Grafana, custom scripts, or mobile-only tools. FlowMonix is purpose-built for the agency use case: one team, many client n8n instances, zero tolerance for silent failures.

---

*Last updated: April 2025*
