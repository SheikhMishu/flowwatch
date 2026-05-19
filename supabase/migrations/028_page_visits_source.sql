-- Migration 028: add source column to page_visits to distinguish landing vs app traffic

alter table page_visits add column if not exists source text check (source in ('landing', 'app'));

-- Backfill existing rows from page path + user_id heuristic
update page_visits
set source = case
  when page like '/dashboard%' or page like '/admin%' or user_id is not null then 'app'
  else 'landing'
end
where source is null;

-- Index for source-filtered queries used in admin analytics
create index if not exists page_visits_source_created_idx on page_visits (source, created_at desc);
