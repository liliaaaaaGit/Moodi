-- NUR ausfuehren, wenn Tabellen profiles/skills/habits schon existieren.
-- Schritt 1: Indizes (einmalig)
create unique index if not exists skills_user_name_unique on skills (user_id, name);
create unique index if not exists habits_user_name_unique on habits (user_id, name);

-- Schritt 2: Seed-Funktion
create or replace function seed_user_defaults(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into skills (user_id, name, kategorie, dauer_minuten, level_min, level_max)
  values
    (p_user_id, 'Drei gute Dinge heute aufschreiben', 'reflexion', 5, 0, 3),
    (p_user_id, 'Dankbarkeits-Mini: 1 Sache benennen', 'reflexion', 2, 0, 3),
    (p_user_id, 'Tee oder Wasser bewusst trinken', 'ressource', 5, 0, 3),
    (p_user_id, 'Ressourcen-Check: Was hat heute Energie gegeben?', 'reflexion', 5, 0, 3),
    (p_user_id, 'Morgen-Prioritaet festlegen', 'planung', 5, 0, 3),
    (p_user_id, 'Lieblingsmusik bewusst hoeren (1 Lied)', 'ressource', 5, 0, 3),
    (p_user_id, 'Body-Scan kurz', 'reflexion', 5, 0, 3),
    (p_user_id, 'Fenster auf, 1 Minute atmen', 'atem', 2, 0, 3),
    (p_user_id, 'Brain-Dump 5 Minuten', 'entlastung', 5, 4, 6),
    (p_user_id, 'To-do-Sortierung Muss/Soll/Kann', 'entlastung', 10, 4, 6),
    (p_user_id, '2-Minuten-Regel: kleinste naechste Aufgabe', 'aktivierung', 2, 4, 6),
    (p_user_id, 'Eine Sache erledigen, eine streichen', 'entlastung', 10, 4, 6),
    (p_user_id, 'Gedanken-Check: Ist das wirklich so?', 'kognitiv', 5, 4, 6),
    (p_user_id, 'Beduerfnis-Check', 'reflexion', 5, 4, 6),
    (p_user_id, 'Tagesstruktur-Reset (naechste 2h planen)', 'planung', 5, 4, 6),
    (p_user_id, 'Mini-Aufraeum: 5 Minuten Schreibtisch', 'aktivierung', 5, 4, 6),
    (p_user_id, 'Sprachnachricht an Vertrauensperson', 'sozial', 5, 4, 6),
    (p_user_id, '4-7-8-Atmung (3 Runden)', 'atem', 2, 4, 8),
    (p_user_id, 'Box-Breathing 4-4-4-4', 'atem', 3, 4, 8),
    (p_user_id, '5-4-3-2-1-Sinne', 'grounding', 3, 4, 8),
    (p_user_id, 'Gegenstand genau beschreiben', 'grounding', 3, 4, 8),
    (p_user_id, 'Joggen oder zuegig spazieren', 'bewegung', 20, 3, 7),
    (p_user_id, 'Yoga-Einheit (kurz)', 'bewegung', 15, 3, 7),
    (p_user_id, 'Schwimmen gehen', 'bewegung', 45, 3, 6),
    (p_user_id, 'Radfahren', 'bewegung', 30, 3, 7),
    (p_user_id, 'Wandern', 'bewegung', 90, 3, 6),
    (p_user_id, 'Tennis oder Padel mit Freund:in', 'bewegung', 60, 3, 6),
    (p_user_id, 'Sport mit Freunden (allgemein)', 'bewegung', 60, 3, 7),
    (p_user_id, '10-Minuten-Workout zu Hause', 'bewegung', 10, 4, 7),
    (p_user_id, 'Spazieren mit Freund:in', 'bewegung', 30, 3, 7),
    (p_user_id, 'Kaltes Wasser ins Gesicht', 'koerper', 1, 7, 8),
    (p_user_id, 'Eiswuerfel in der Hand halten', 'koerper', 1, 7, 8),
    (p_user_id, 'Kalte Dusche 30 Sekunden', 'koerper', 2, 7, 8),
    (p_user_id, '60 Sekunden intensive Bewegung', 'koerper', 1, 7, 8),
    (p_user_id, 'Wand kraftvoll druecken', 'koerper', 1, 7, 8),
    (p_user_id, 'Scharfes Bonbon oder Ingwer', 'koerper', 2, 7, 8),
    (p_user_id, 'Butterfly Hug', 'grounding', 3, 7, 8),
    (p_user_id, 'Auto fahren, kurze Strecke', 'umgebungswechsel', 30, 7, 10),
    (p_user_id, 'Raus, frische Luft, Umgebungswechsel', 'umgebungswechsel', 20, 7, 10),
    (p_user_id, 'Nach Dachau (Schloss/Aussichtsplattform)', 'umgebungswechsel', 60, 7, 10),
    (p_user_id, 'Lieblingstee in Lieblingsbecher, bewusst trinken', 'beruhigung', 10, 4, 8),
    (p_user_id, 'Weiche Decke + Lieblingssong', 'beruhigung', 10, 4, 8),
    (p_user_id, 'Hand auf Brust, langsam atmen', 'beruhigung', 2, 4, 8),
    (p_user_id, 'Selbstmitgefuehlspause', 'beruhigung', 3, 4, 8),
    (p_user_id, 'Warme Dusche', 'beruhigung', 10, 4, 8),
    (p_user_id, 'Lieblingsduft riechen', 'beruhigung', 2, 4, 8),
    (p_user_id, '5 Minuten an die frische Luft', 'aktivierung', 5, 4, 7),
    (p_user_id, '1 Lied tanzen', 'aktivierung', 3, 4, 7),
    (p_user_id, 'Waesche aufhaengen oder Geschirr spuelen', 'aktivierung', 10, 4, 7),
    (p_user_id, 'Aus dem Bett: Fuesse auf den Boden, 5 Min sitzen', 'aktivierung', 5, 4, 7),
    (p_user_id, 'Wasser trinken, ein Glas', 'aktivierung', 1, 4, 7),
    (p_user_id, 'Fenster auf, durchatmen', 'aktivierung', 2, 4, 7),
    (p_user_id, 'Pink Noise oder weisses Rauschen', 'reizreduktion', 10, 5, 8),
    (p_user_id, 'Abgedunkelter Raum, 10 Min', 'reizreduktion', 10, 5, 8),
    (p_user_id, 'Handy in anderes Zimmer', 'reizreduktion', 1, 5, 8),
    (p_user_id, 'Augenmaske auf, 5 Min', 'reizreduktion', 5, 5, 8),
    (p_user_id, 'Alle Tabs schliessen, nur ein Fenster', 'reizreduktion', 2, 5, 8),
    (p_user_id, 'TIPP: Eis ins Gesicht + langsames Ausatmen + Muskeln an/aus', 'krise', 5, 9, 10),
    (p_user_id, 'Telefonseelsorge 0800 111 0 111 anrufen', 'krise', 30, 9, 10)
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

-- Schritt 3: Daten fuer deinen User anlegen (UUID ersetzen!)
-- select seed_user_defaults('HIER-DEINE-USER-UUID');
