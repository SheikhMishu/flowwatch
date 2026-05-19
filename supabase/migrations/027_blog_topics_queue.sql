-- Additional blog topic ideas for the n8n auto-publish workflow

insert into blog_topics (topic, primary_keyword, category, created_at) values
  ('n8n webhook reliability — handling missed or dropped triggers',       'n8n webhook reliability',               'Monitoring',    now() + interval '1 second'),
  ('How to monitor n8n workflow execution time and detect slow runs',     'n8n workflow execution time',           'Monitoring',    now() + interval '2 seconds'),
  ('n8n credential errors in production — catching and recovering',       'n8n credential errors',                 'n8n Debugging', now() + interval '3 seconds'),
  ('Scaling n8n for multiple clients — multi-tenant workflow patterns',   'n8n multi-tenant workflows',            'n8n Setup',     now() + interval '4 seconds'),
  ('n8n environment variables and secrets management',                    'n8n environment variables secrets',     'n8n Setup',     now() + interval '5 seconds'),
  ('How to structure n8n workflows for easier debugging',                 'n8n workflow structure debugging',      'n8n Debugging', now() + interval '6 seconds'),
  ('n8n Docker self-hosting setup guide',                                 'n8n Docker self-hosting',               'n8n Setup',     now() + interval '7 seconds'),
  ('n8n execution data — what to log and for how long',                  'n8n execution data logging',            'Monitoring',    now() + interval '8 seconds'),
  ('n8n workflow versioning — managing changes without breaking production', 'n8n workflow versioning',            'n8n Debugging', now() + interval '9 seconds'),
  ('How to test n8n workflows before going live',                         'how to test n8n workflows',             'n8n Debugging', now() + interval '10 seconds');
