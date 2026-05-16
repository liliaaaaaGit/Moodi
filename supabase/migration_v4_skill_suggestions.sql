alter table checkins
  add column if not exists suggested_short_skill_ids uuid[]
  default '{}'::uuid[];
