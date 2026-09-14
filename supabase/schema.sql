-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.

-- Topics a signed-in user has bookmarked, so returning users don't have to
-- retype searches or re-click categories every visit. `position` is the
-- user's chosen display order on the dashboard (lower = earlier); new
-- topics are appended after the current highest position.
create table if not exists bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  is_category boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, topic, is_category)
);

alter table bookmarks enable row level security;

create policy "Users can view their own bookmarks"
  on bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can add their own bookmarks"
  on bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bookmarks"
  on bookmarks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own bookmarks"
  on bookmarks for delete
  using (auth.uid() = user_id);

-- Each digest a signed-in user has generated, per topic, so a later
-- generation for the same topic can be diffed against it ("what's new
-- since last time") without needing a separate caching layer.
create table if not exists digest_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  is_category boolean not null default false,
  digest jsonb not null,
  created_at timestamptz not null default now()
);

alter table digest_history enable row level security;

create policy "Users can view their own digest history"
  on digest_history for select
  using (auth.uid() = user_id);

create policy "Users can add their own digest history"
  on digest_history for insert
  with check (auth.uid() = user_id);

create index if not exists digest_history_user_topic_idx
  on digest_history (user_id, topic, is_category, created_at desc);

-- Migration for projects that already ran the script above before topic
-- ordering existed. Safe to re-run — every statement is idempotent. Paste
-- just this block into SQL Editor > New query > Run.
alter table bookmarks add column if not exists position integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'bookmarks' and policyname = 'Users can update their own bookmarks'
  ) then
    create policy "Users can update their own bookmarks"
      on bookmarks for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Backfill existing rows (all default to position 0) with a stable order
-- based on when they were first bookmarked.
with ranked as (
  select id, row_number() over (partition by user_id order by created_at asc) - 1 as rn
  from bookmarks
)
update bookmarks
set position = ranked.rn
from ranked
where bookmarks.id = ranked.id;
