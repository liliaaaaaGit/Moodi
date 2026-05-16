-- Profile (eine User-Reihe)
create table profiles (
id uuid references auth.users on delete cascade primary key,
email text not null,
created_at timestamptz default now()
);
-- Skills
create table skills (
id uuid default gen_random_uuid() primary key,
user_id uuid references auth.users not null,
name text not null,
kategorie text not null,
dauer_minuten int,
level_min int not null check (level_min between 0 and 10),
level_max int not null check (level_max between 0 and 10),
beschreibung text,
ist_lang boolean default false,
aktiv boolean default true,
created_at timestamptz default now()
);
-- Check-ins
create table checkins (
id uuid default gen_random_uuid() primary key,
user_id uuid references auth.users not null,
created_at timestamptz default now(),
level_before int not null check (level_before between 0 and 10),
input_raw text,
situation text, gedanken text, koerper text,
gefuehl text, beduerfnis text,
suggested_skill_id uuid references skills(id) on delete set null,
chosen_skill_id uuid references skills(id) on delete set null,
skill_status text check (skill_status in
('gemacht'
,
'nicht_gemacht'
,
'anderer'
,
'uebersprungen')),
suggested_long_skill_id uuid references skills(id) on delete set null,
chosen_long_skill_id uuid references skills(id) on delete set null,
long_skill_status text check (long_skill_status in
('gemacht'
,
'nicht_gemacht'
,
'anderer'
,
'uebersprungen')),
level_after int check (level_after between 0 and 10),
hilfreich text check (hilfreich in ('ja'
,
'bisschen'
,
'nein')),
comment text,
crisis_flag boolean default false,
svv_flag boolean default false,
chosen_svv_skill_id uuid references skills(id) on delete set null,
svv_skill_status text check (svv_skill_status in
('gemacht'
,
'nicht_gemacht'
,
'anderer'
,
'uebersprungen'))
);
-- Settings
create table settings (
user_id uuid references auth.users on delete cascade primary key,
notfallkontakte jsonb default '[]'::jsonb,
pin_hash text,
reminder_times text[] default array['10:00'
,
'15:00'
,
'21:00'],
push_subscription jsonb,
created_at timestamptz default now()
);
-- Habits (taegliche Rituale wie Atemfokus)
create table habits (
id uuid default gen_random_uuid() primary key,
user_id uuid references auth.users not null,
name text not null,
beschreibung text,
target_minutes int,
aktiv boolean default true,
created_at timestamptz default now()
);
-- Habit Completions (eine pro Tag pro Habit)
create table habit_completions (
id uuid default gen_random_uuid() primary key,
user_id uuid references auth.users not null,
habit_id uuid references habits(id) on delete cascade not null,
completed_at timestamptz default now(),
completed_date date generated always as
((completed_at at time zone 'Europe/Berlin')::date) stored
);
create unique index habit_completions_one_per_day
on habit_completions (habit_id, completed_date);
-- Row Level Security
alter table profiles enable row level security;
alter table skills enable row level security;
alter table checkins enable row level security;
alter table settings enable row level security;
alter table habits enable row level security;
alter table habit_completions enable row level security;
create policy "own profile" on profiles
for all using (auth.uid() = id);
create policy "own skills" on skills
for all using (auth.uid() = user_id);
create policy "own checkins" on checkins
for all using (auth.uid() = user_id);
create policy "own settings" on settings
for all using (auth.uid() = user_id);
create policy "own habits" on habits
for all using (auth.uid() = user_id);
create policy "own habit_completions" on habit_completions
for all using (auth.uid() = user_id);
-- Indexes
create index checkins_user_created
on checkins(user_id, created_at desc);
create index skills_user_aktiv on skills(user_id, aktiv);
create index habits_user_aktiv on habits(user_id, aktiv);
-- Eindeutige Namen pro User (idempotentes Seeding)
create unique index skills_user_name_unique on skills (user_id, name);
create unique index habits_user_name_unique on habits (user_id, name);

-- Default-Skills und -Habit fuer neue Nutzerin
create or replace function seed_user_defaults(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into skills (user_id, name, kategorie, dauer_minuten, level_min, level_max, ist_lang, aktiv)
  values
    -- Körper & Reize
    (p_user_id, 'Wasser trinken', 'körper', 1, 4, 5, false, true),
    (p_user_id, 'Kaltes Wasser ins Gesicht', 'körper', 1, 7, 9, false, true),
    (p_user_id, 'Warme Dusche', 'körper', 10, 7, 8, false, true),
    (p_user_id, 'Nagelmatte', 'körper', 10, 7, 8, false, true),
    (p_user_id, 'Tigerbalsam', 'körper', 2, 7, 8, false, true),
    (p_user_id, 'Mango unter der Dusche essen', 'körper', 10, 7, 9, false, true),
    (p_user_id, 'Schwere Decke & Dunkelheit', 'körper', 10, 7, 9, false, true),
    (p_user_id, 'Luft 3min anhalten', 'körper', 3, 8, 10, false, true),
    (p_user_id, 'Muskeln anspannen / entspannen', 'körper', 5, 7, 9, false, true),
    -- Atem & Grounding
    (p_user_id, 'Fenster auf, durchatmen', 'atem', 2, 4, 6, false, true),
    (p_user_id, 'Body Scan', 'grounding', 5, 6, 7, false, true),
    (p_user_id, '5-4-3-2-1 Sinne', 'grounding', 3, 6, 7, false, true),
    (p_user_id, 'Hand auf Brust, langsam atmen, fühlen', 'atem', 3, 6, 9, false, true),
    (p_user_id, '4-7-8 Atmung (3 Runden)', 'atem', 2, 6, 8, false, true),
    (p_user_id, 'Box-Breathing', 'atem', 3, 6, 8, false, true),
    -- Bewegung & Aktivierung
    (p_user_id, '5 Minuten an die frische Luft', 'bewegung', 5, 4, 6, false, true),
    (p_user_id, '10 min aufräumen', 'aktivierung', 10, 4, 6, false, true),
    (p_user_id, '5 min in die Sonne legen und atmen', 'aktivierung', 5, 6, 7, false, true),
    (p_user_id, 'Jonglieren', 'bewegung', 5, 4, 7, false, true),
    -- Kognitive Entlastung
    (p_user_id, 'Bedürfnis-Check', 'kognitiv', 5, 4, 6, false, true),
    (p_user_id, 'To-Dos', 'kognitiv', 10, 5, 7, false, true),
    (p_user_id, 'Brain-Dump (5min)', 'kognitiv', 5, 6, 7, false, true),
    (p_user_id, 'Sich den Feind in einer löchrigen Unterhose vorstellen', 'kognitiv', 2, 7, 8, false, true),
    -- Selbstberuhigung & Verbindung
    (p_user_id, 'Self Care', 'beruhigung', 10, 4, 6, false, true),
    (p_user_id, 'Elli knuddeln', 'beruhigung', 5, 4, 6, false, true),
    (p_user_id, 'Hug', 'beruhigung', 2, 7, 8, false, true),
    (p_user_id, 'Klavier spielen', 'beruhigung', 15, 5, 10, false, true),
    -- Umgebungswechsel
    (p_user_id, 'Auto fahren', 'umgebungswechsel', 30, 7, 10, false, true),
    (p_user_id, 'Raus, frische Luft, Umgebungswechsel', 'umgebungswechsel', 20, 8, 10, false, true),
    (p_user_id, 'Dachau Schloss', 'umgebungswechsel', 60, 9, 10, false, true),
    -- SVV-spezifisch (NUR bei explizitem SVV-Trigger, NIE als Default)
    (p_user_id, 'Arm bemalen', 'svv', 5, 1, 10, false, true),
    -- Lange Skills (ist_lang = true)
    (p_user_id, 'Mandala / Malen', 'lang', 45, 2, 8, true, true),
    (p_user_id, 'Badespaß mit Elli', 'lang', 30, 2, 8, true, true),
    (p_user_id, 'Walk', 'lang', 30, 2, 8, true, true),
    (p_user_id, 'Sauna / Spa', 'lang', 90, 2, 8, true, true),
    (p_user_id, 'Blumen pflücken gehen', 'lang', 45, 2, 8, true, true),
    (p_user_id, 'Erdbeeren pflücken gehen', 'lang', 60, 2, 8, true, true),
    (p_user_id, 'Sport mit Friends (Squash, Tennis, Wakeboarden)', 'lang', 90, 2, 8, true, true),
    (p_user_id, 'Cafe trinken gehen', 'lang', 45, 2, 8, true, true),
    (p_user_id, 'An See fahren', 'lang', 120, 2, 8, true, true),
    (p_user_id, 'Schwimmen gehen', 'lang', 60, 2, 8, true, true),
    (p_user_id, 'Freediving', 'lang', 90, 2, 8, true, true),
    (p_user_id, 'SUP', 'lang', 90, 2, 8, true, true),
    (p_user_id, 'Eiscafé in der Sonne trinken', 'lang', 45, 2, 8, true, true),
    (p_user_id, 'Wald', 'lang', 60, 2, 8, true, true),
    (p_user_id, 'Film schauen mit Snacks', 'lang', 120, 2, 8, true, true),
    (p_user_id, 'Kart fahren', 'lang', 60, 2, 8, true, true),
    (p_user_id, 'Kino', 'lang', 120, 2, 8, true, true)
  on conflict (user_id, name) do nothing;

  insert into habits (user_id, name, beschreibung, target_minutes)
  values (
    p_user_id,
    'Atemfokus 5 Minuten',
    '5 Min bewusst auf den Atem achten',
    5
  )
  on conflict (user_id, name) do nothing;
end;
$$;
