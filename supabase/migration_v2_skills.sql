-- ============================================
-- Migration v2: Skills komplett ersetzen
-- Schema-Erweiterungen für 2-Skill-Vorschlag + SVV
-- ============================================

-- Schema-Erweiterung
alter table skills add column if not exists ist_lang boolean default false;

alter table checkins add column if not exists suggested_long_skill_id uuid;
alter table checkins add column if not exists chosen_long_skill_id uuid;
alter table checkins add column if not exists long_skill_status text
  check (long_skill_status in ('gemacht','nicht_gemacht','anderer','uebersprungen'));
alter table checkins add column if not exists svv_flag boolean default false;

-- FKs auf ON DELETE SET NULL umstellen, damit alte Skills gelöscht werden können
alter table checkins drop constraint if exists checkins_suggested_skill_id_fkey;
alter table checkins add constraint checkins_suggested_skill_id_fkey
  foreign key (suggested_skill_id) references skills(id) on delete set null;

alter table checkins drop constraint if exists checkins_chosen_skill_id_fkey;
alter table checkins add constraint checkins_chosen_skill_id_fkey
  foreign key (chosen_skill_id) references skills(id) on delete set null;

alter table checkins drop constraint if exists checkins_suggested_long_skill_id_fkey;
alter table checkins add constraint checkins_suggested_long_skill_id_fkey
  foreign key (suggested_long_skill_id) references skills(id) on delete set null;

alter table checkins drop constraint if exists checkins_chosen_long_skill_id_fkey;
alter table checkins add constraint checkins_chosen_long_skill_id_fkey
  foreign key (chosen_long_skill_id) references skills(id) on delete set null;

-- Skills ersetzen (im SQL Editor ist auth.uid() oft NULL — Nutzer-ID aus profiles)
do $$
declare
  target_user_id uuid;
begin
  select id into target_user_id
  from profiles
  where email = 'lilia@schraut.de'
  limit 1;

  if target_user_id is null then
    select id into target_user_id from profiles limit 1;
  end if;

  if target_user_id is null then
    raise exception 'Kein Nutzer in profiles gefunden. E-Mail in der Migration anpassen.';
  end if;

  delete from skills where user_id = target_user_id;

  insert into skills (user_id, name, kategorie, dauer_minuten, level_min, level_max, ist_lang, aktiv) values
  -- Körper & Reize
  (target_user_id, 'Wasser trinken', 'körper', 1, 4, 5, false, true),
  (target_user_id, 'Kaltes Wasser ins Gesicht', 'körper', 1, 7, 9, false, true),
  (target_user_id, 'Warme Dusche', 'körper', 10, 7, 8, false, true),
  (target_user_id, 'Nagelmatte', 'körper', 10, 7, 8, false, true),
  (target_user_id, 'Tigerbalsam', 'körper', 2, 7, 8, false, true),
  (target_user_id, 'Mango unter der Dusche essen', 'körper', 10, 7, 9, false, true),
  (target_user_id, 'Schwere Decke & Dunkelheit', 'körper', 10, 7, 9, false, true),
  (target_user_id, 'Luft 3min anhalten', 'körper', 3, 8, 10, false, true),
  (target_user_id, 'Muskeln anspannen / entspannen', 'körper', 5, 7, 9, false, true),
  -- Atem & Grounding
  (target_user_id, 'Fenster auf, durchatmen', 'atem', 2, 4, 6, false, true),
  (target_user_id, 'Body Scan', 'grounding', 5, 6, 7, false, true),
  (target_user_id, '5-4-3-2-1 Sinne', 'grounding', 3, 6, 7, false, true),
  (target_user_id, 'Hand auf Brust, langsam atmen, fühlen', 'atem', 3, 6, 9, false, true),
  (target_user_id, '4-7-8 Atmung (3 Runden)', 'atem', 2, 6, 8, false, true),
  (target_user_id, 'Box-Breathing', 'atem', 3, 6, 8, false, true),
  -- Bewegung & Aktivierung
  (target_user_id, '5 Minuten an die frische Luft', 'bewegung', 5, 4, 6, false, true),
  (target_user_id, '10 min aufräumen', 'aktivierung', 10, 4, 6, false, true),
  (target_user_id, '5 min in die Sonne legen und atmen', 'aktivierung', 5, 6, 7, false, true),
  (target_user_id, 'Jonglieren', 'bewegung', 5, 4, 7, false, true),
  -- Kognitive Entlastung
  (target_user_id, 'Bedürfnis-Check', 'kognitiv', 5, 4, 6, false, true),
  (target_user_id, 'To-Dos', 'kognitiv', 10, 5, 7, false, true),
  (target_user_id, 'Brain-Dump (5min)', 'kognitiv', 5, 6, 7, false, true),
  (target_user_id, 'Sich den Feind in einer löchrigen Unterhose vorstellen', 'kognitiv', 2, 7, 8, false, true),
  -- Selbstberuhigung & Verbindung
  (target_user_id, 'Self Care', 'beruhigung', 10, 4, 6, false, true),
  (target_user_id, 'Elli knuddeln', 'beruhigung', 5, 4, 6, false, true),
  (target_user_id, 'Hug', 'beruhigung', 2, 7, 8, false, true),
  (target_user_id, 'Klavier spielen', 'beruhigung', 15, 5, 10, false, true),
  -- Umgebungswechsel
  (target_user_id, 'Auto fahren', 'umgebungswechsel', 30, 7, 10, false, true),
  (target_user_id, 'Raus, frische Luft, Umgebungswechsel', 'umgebungswechsel', 20, 8, 10, false, true),
  (target_user_id, 'Dachau Schloss', 'umgebungswechsel', 60, 9, 10, false, true),
  -- SVV-spezifisch (NUR bei explizitem SVV-Trigger, NIE als Default)
  (target_user_id, 'Arm bemalen', 'svv', 5, 1, 10, false, true),
  -- Lange Skills (ist_lang = true)
  (target_user_id, 'Mandala / Malen', 'lang', 45, 2, 8, true, true),
  (target_user_id, 'Badespaß mit Elli', 'lang', 30, 2, 8, true, true),
  (target_user_id, 'Walk', 'lang', 30, 2, 8, true, true),
  (target_user_id, 'Sauna / Spa', 'lang', 90, 2, 8, true, true),
  (target_user_id, 'Blumen pflücken gehen', 'lang', 45, 2, 8, true, true),
  (target_user_id, 'Erdbeeren pflücken gehen', 'lang', 60, 2, 8, true, true),
  (target_user_id, 'Sport mit Friends (Squash, Tennis, Wakeboarden)', 'lang', 90, 2, 8, true, true),
  (target_user_id, 'Cafe trinken gehen', 'lang', 45, 2, 8, true, true),
  (target_user_id, 'An See fahren', 'lang', 120, 2, 8, true, true),
  (target_user_id, 'Schwimmen gehen', 'lang', 60, 2, 8, true, true),
  (target_user_id, 'Freediving', 'lang', 90, 2, 8, true, true),
  (target_user_id, 'SUP', 'lang', 90, 2, 8, true, true),
  (target_user_id, 'Eiscafé in der Sonne trinken', 'lang', 45, 2, 8, true, true),
  (target_user_id, 'Wald', 'lang', 60, 2, 8, true, true),
  (target_user_id, 'Film schauen mit Snacks', 'lang', 120, 2, 8, true, true),
  (target_user_id, 'Kart fahren', 'lang', 60, 2, 8, true, true),
  (target_user_id, 'Kino', 'lang', 120, 2, 8, true, true);
end $$;
