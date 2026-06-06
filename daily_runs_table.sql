-- Run this in Supabase SQL Editor
create table if not exists daily_runs (
  id            bigserial primary key,
  run_date      date not null,
  leads_added   int default 0,
  leads_skipped int default 0,
  total_companies_searched int default 0,
  created_at    timestamptz default now()
);

alter table daily_runs enable row level security;

create policy "Allow all" on daily_runs for all using (true);
