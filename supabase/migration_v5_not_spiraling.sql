-- Im Supabase SQL Editor ausführen
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS not_spiraling_context text;
