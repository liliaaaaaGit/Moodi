PROJEKT: Anspannung-Tracker - private mobile-first PWA fuer eine
einzelne Nutzerin (Tanja).
ZWECK: Beliebige Check-ins zum Anspannungslevel 0-10, Sprach- oder
Texteingabe, KI-Strukturierung (OpenAI), Skill-Vorschlag basierend
auf Level, Verlaufsanalyse. Plus taegliche Habit-Cards
(Atemfokus 5 Min).
TECH: Next.js 14 App Router, TypeScript, Tailwind, Supabase
(Postgres + Magic-Link-Auth), OpenAI (gpt-4o-mini + whisper-1),
Vercel Hosting, PWA mit iOS Push (iOS 16.4+).
DESIGN-SYSTEM:
- Mobile-first, iPhone Safari optimiert
- Farben: bg #F5F8FC, surface #FFFFFF, primary #7BA7C9,
accent #A8C5DA, text-primary #1E2A38,
text-secondary #6B7A8C, warning #C97B7B
- Font: Inter (UI)
- Grosse Touch-Targets (min 56px), rounded-2xl, weiche Schatten,
viel Whitespace
- Dezente Animationen, kein Bouncing
- Bottom-Tab-Navigation: Heute, Check-in, Verlauf, Skills
DATENMODELL: Tabellen profiles, skills, checkins, settings,
habits, habit_completions (Schema in Schritt 2).
SICHERHEIT: Supabase Magic Link (Closed Signup, nur eine Email
erlaubt), 1-Jahres-Session, optionaler 4-stelliger PIN-Gate
clientseitig.
KRITISCH: Bei Level >= 9 oder Trigger-Woertern (Suizid,
Selbstverletzung,
"nicht mehr leben"
,
"kann nicht mehr")
-> crisis_flag = true -> kein KI-Strukturieren-Output anzeigen,
sofortige Krisen-Anzeige (3 kurze Skills + Umgebungswechsel +
Bayrischer Krisendienst 0800 655 3000 + Hinweis "112 bei akuter Gefahr").
CODE-STIL: Server Components by default,
"use client" nur wo
noetig, async/await, klare Komponenten, keine over-engineerten
Abstraktionen.
PWA PUSH (Vercel ENV):
- NEXT_PUBLIC_VAPID_PUBLIC_KEY — oeffentlicher VAPID-Key, im Browser
  (PushOptIn / pushManager.subscribe); nach Aenderung neu deployen.
- VAPID_PRIVATE_KEY — nur Server (Cron / web-push senden).
- VAPID_SUBJECT — z.B. mailto:…
- CRON_SECRET — PFLICHT in Vercel fuer /api/cron/reminders (Bearer-Header);
  ohne Variable schlagen automatische Erinnerungen fehl (401)
- Cron-Zeiten UTC in vercel.json (8/13/19), Erinnerungen pruefen Berlin-Zeit
  mit ~55 Min Fenster (Hobby: Cron kann innerhalb der Stunde ausloesen)
- Kein VAPID_PUBLIC_KEY ohne NEXT_PUBLIC_ — wird im Client nicht gelesen.
