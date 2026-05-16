-- Semantische Trigger (KI-extrahiert, pro User dedupliziert)
create table if not exists triggers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  label text not null,
  created_at timestamptz default now()
);

create unique index if not exists triggers_user_label_unique
  on triggers (user_id, lower(trim(label)));

alter table triggers enable row level security;
create policy "own triggers" on triggers
  for all using (auth.uid() = user_id);

alter table checkins add column if not exists trigger_id uuid
  references triggers(id) on delete set null;

create index if not exists checkins_trigger_id_idx
  on checkins(trigger_id);
create index if not exists triggers_user_id_idx
  on triggers(user_id);
