-- Einmalig im Supabase SQL Editor ausfuehren.
-- Korrigiert Skill-Namen, die beim Seeding ohne echte Umlaute angelegt wurden.
-- Kein globales replace — nur explizite betroffene Zeilen.

update skills set name = 'Morgen-Priorität festlegen'
where name = 'Morgen-Prioritaet festlegen';

update skills set name = 'Lieblingsmusik bewusst hören (1 Lied)'
where name = 'Lieblingsmusik bewusst hoeren (1 Lied)';

update skills set name = '2-Minuten-Regel: kleinste nächste Aufgabe'
where name = '2-Minuten-Regel: kleinste naechste Aufgabe';

update skills set name = 'Bedürfnis-Check'
where name = 'Beduerfnis-Check';

update skills set name = 'Tagesstruktur-Reset (nächste 2h planen)'
where name = 'Tagesstruktur-Reset (naechste 2h planen)';

update skills set name = 'Mini-Aufräumen: 5 Minuten Schreibtisch'
where name = 'Mini-Aufraeum: 5 Minuten Schreibtisch';

update skills set name = 'Joggen oder zügig spazieren'
where name = 'Joggen oder zuegig spazieren';

update skills set name = 'Eiswürfel in der Hand halten'
where name = 'Eiswuerfel in der Hand halten';

update skills set name = 'Wand kraftvoll drücken'
where name = 'Wand kraftvoll druecken';

update skills set name = 'Selbstmitgefühlspause'
where name = 'Selbstmitgefuehlspause';

update skills set name = 'Wäsche aufhängen oder Geschirr spülen'
where name = 'Waesche aufhaengen oder Geschirr spuelen';

update skills set name = 'Aus dem Bett: Füße auf den Boden, 5 Min sitzen'
where name = 'Aus dem Bett: Fuesse auf den Boden, 5 Min sitzen';

update skills set name = 'Pink Noise oder weißes Rauschen'
where name = 'Pink Noise oder weisses Rauschen';

update skills set name = 'Alle Tabs schließen, nur ein Fenster'
where name = 'Alle Tabs schliessen, nur ein Fenster';
