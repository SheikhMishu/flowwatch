-- Blog topic queue for n8n auto-publishing workflow.
-- n8n reads 'idea' rows to pick the next topic, writes back 'published' + slug after GitHub commit.

create table blog_topics (
  id               uuid        primary key default gen_random_uuid(),
  topic            text        not null,
  primary_keyword  text,
  category         text,
  status           text        not null default 'idea' check (status in ('idea', 'published', 'skipped')),
  slug             text,
  published_at     date,
  created_at       timestamptz not null default now()
);

-- n8n queries this frequently; index the common filter
create index blog_topics_status_created_at on blog_topics (status, created_at);

-- Seed: already-published posts
insert into blog_topics (topic, primary_keyword, category, status, slug, published_at) values
  ('n8n workflow monitoring and silent failures',       'n8n workflow monitoring',       'Monitoring',    'published', 'n8n-workflow-monitoring-silent-failures',       '2026-05-05'),
  ('How to debug n8n workflows',                        'how to debug n8n workflows',    'n8n Debugging', 'published', 'how-to-debug-n8n-workflows',                    '2026-05-12'),
  ('n8n execution errors vs silent data failures',      'n8n execution errors vs silent failures', 'Monitoring', 'published', 'n8n-execution-errors-vs-silent-data-failures', '2026-05-15'),
  ('n8n successful failures — workflows that complete but break business processes', 'n8n successful failures production', 'Monitoring', 'published', 'n8n-successful-failures-production-monitoring', '2026-05-19');

-- Seed: ideas queue (order = priority)
insert into blog_topics (topic, primary_keyword, category, created_at) values
  ('How to set up n8n error workflows',             'n8n error workflow',               'n8n Debugging', now() + interval '1 second'),
  ('n8n production checklist before going live',    'n8n production checklist',         'Monitoring',    now() + interval '2 seconds'),
  ('n8n self-hosting vs cloud: which should you use', 'n8n self-hosting vs cloud',      'n8n Setup',     now() + interval '3 seconds'),
  ('n8n rate limiting and retries',                 'n8n rate limiting retries',        'n8n Debugging', now() + interval '4 seconds'),
  ('How to set up n8n Slack alerts',                'n8n Slack alerts',                 'Monitoring',    now() + interval '5 seconds'),
  ('n8n vs Zapier vs Make for production monitoring', 'n8n vs Zapier Make monitoring',  'Monitoring',    now() + interval '6 seconds');
