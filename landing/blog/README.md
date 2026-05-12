# Blog Content Tracker

Live at: flowmonix.com/blog
Cadence: 1 post per week
Location: `landing/blog/*.md`

## Published

| Slug | Primary Keyword | Published |
|---|---|---|
| `n8n-workflow-monitoring-silent-failures` | n8n workflow monitoring | 2026-05-05 |
| `how-to-debug-n8n-workflows` | how to debug n8n workflows | 2026-05-12 |

## In Drafts (not yet published)

| Slug | Primary Keyword | Planned |
|---|---|---|
| `n8n-execution-errors-vs-silent-data-failures` | n8n execution errors vs silent failures | 2026-05-15 |
| `n8n-successful-failures-production-monitoring` | n8n successful failures production | TBD |

## Topics Covered (don't repeat)
- Silent failures / no alerts
- Debugging techniques (pin data, execution log, HTTP/JSON errors)
- Execution errors vs silent data failures (webhooks stopping, API returning empty data, partial success)
- Workflows that succeed but break business processes (partial syncs, AI node degradation, duplicate executions, slow degradation)

## Ideas for Future Posts
- n8n error workflow setup
- n8n production checklist
- n8n self-hosting vs cloud
- n8n rate limiting and retries
- How to set up n8n Slack alerts
- n8n vs Zapier/Make for monitoring

## Adding a Post
1. Create `landing/blog/your-slug.md` with frontmatter
2. Set `publishedAt` date
3. Push — appears automatically
