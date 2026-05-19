# Blog Content Tracker

Live at: flowmonix.com/blog
Cadence: 2x per week (Monday + Thursday at 9am AEST) via n8n auto-publish workflow
Location: `landing/blog/*.md`

## n8n Auto-Publish Setup

The blog is fully automated. The n8n workflow JSON is at `landing/blog/n8n.json`.

**Flow:**
1. Schedule Trigger (Mon + Thu 9am) → fetches oldest `idea` row from `blog_topics` Supabase table
2. Fetches all `published` rows to build a "topics already covered" list for GPT-4o context
3. GPT-4o (gpt-4o) generates the post with frontmatter
4. Derives slug from title, calculates reading time
5. Commits `.md` file to `landing/blog/{slug}.md` on `master` via GitHub API
6. Updates the `blog_topics` row: `status → published`, sets `slug` and `published_at`

**Supabase table:** `blog_topics` — columns: `id`, `topic`, `primary_keyword`, `category`, `status` (idea/published/skipped), `slug`, `published_at`, `created_at`

**To add topics:** INSERT rows with `status = 'idea'` into `blog_topics`. The workflow picks them in `created_at` ascending order (oldest first). See `supabase/migrations/026_blog_topics.sql` and `027_blog_topics_queue.sql` for examples.

**Credentials used in n8n:**
- Supabase: `Supabase account FL` (id: xiqmYg7ErwF8w7ca)
- OpenAI: `OpenAi account` (id: PU2gSY52U3wAhPhW)
- GitHub: `GitHub account Sheikh` (id: 0g4rKF6jbzLGro2O) — pushes to `SheikhMishu/flowwatch` master

---

## Published

| Slug | Primary Keyword | Published |
|---|---|---|
| `n8n-workflow-monitoring-silent-failures` | n8n workflow monitoring | 2026-05-05 |
| `how-to-debug-n8n-workflows` | how to debug n8n workflows | 2026-05-12 |
| `mastering-the-setup-of-n8n-error-workflows` | n8n error workflow | 2026-05-13 |
| `crafting-an-effective-n8n-production-checklist` | n8n production checklist | 2026-05-13 |
| `n8n-selfhosting-vs-cloud-which-should-you-use` | n8n self-hosting vs cloud | 2026-05-17 |

## Topics Covered (don't repeat)
- Silent failures / no alerts
- Debugging techniques (pin data, execution log, HTTP/JSON errors)
- Error workflow setup (Error Trigger node, Slack/email notifications, retry logic)
- Production checklist before going live
- Self-hosting vs cloud (cost, control, maintenance tradeoffs)

---

## Ideas Queue (in `blog_topics` table, status = idea)

From migration 026:
- n8n rate limiting and retries
- How to set up n8n Slack alerts
- n8n vs Zapier vs Make for production monitoring

From migration 027 (added 2026-05-19):
- n8n webhook reliability — handling missed or dropped triggers
- How to monitor n8n workflow execution time and detect slow runs
- n8n credential errors in production — catching and recovering
- Scaling n8n for multiple clients — multi-tenant workflow patterns
- n8n environment variables and secrets management
- How to structure n8n workflows for easier debugging
- n8n Docker self-hosting setup guide
- n8n execution data — what to log and for how long
- n8n workflow versioning — managing changes without breaking production
- How to test n8n workflows before going live

**~6.5 weeks of content remaining at 2x/week.**

---

## Adding a Post Manually
1. Create `landing/blog/your-slug.md` with frontmatter (see existing posts for format)
2. Set `publishedAt` date
3. Push to master — appears automatically
4. INSERT a row into `blog_topics` with `status = 'published'` and the slug so the workflow skips it
