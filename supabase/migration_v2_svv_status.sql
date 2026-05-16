-- SVV-Auswahl getrennt von kurzem Skill (chosen_skill_id bleibt für Cope)
alter table checkins add column if not exists chosen_svv_skill_id uuid;
alter table checkins add column if not exists svv_skill_status text
  check (svv_skill_status in ('gemacht', 'nicht_gemacht', 'anderer', 'uebersprungen'));

alter table checkins drop constraint if exists checkins_chosen_svv_skill_id_fkey;
alter table checkins add constraint checkins_chosen_svv_skill_id_fkey
  foreign key (chosen_svv_skill_id) references skills(id) on delete set null;
