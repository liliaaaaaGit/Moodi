"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { signOut } from "@/app/actions/auth";
import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SectionHeader } from "@/components/SectionHeader";
import { UI_FEATURES } from "@/lib/features";
import { clearPinUnlocked } from "@/lib/pin/storage";

type Contact = { name: string; phone: string };

type Habit = {
  id: string;
  name: string;
  beschreibung: string | null;
  target_minutes: number | null;
  aktiv: boolean;
};

type SettingsData = {
  pinEnabled: boolean;
  notfallkontakte: Contact[];
  reminder_times: string[];
};

export function SettingsClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [pinEnabled, setPinEnabled] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [reminderTimes, setReminderTimes] = useState(["10:00", "15:00", "21:00"]);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState({
    name: "",
    beschreibung: "",
    target_minutes: 5,
  });
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editHabit, setEditHabit] = useState({
    name: "",
    beschreibung: "",
    target_minutes: 5,
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const settingsRes = await fetch("/api/settings");
      const settingsPayload = await settingsRes.json();

      if (settingsRes.ok) {
        const data = settingsPayload as SettingsData;
        setPinEnabled(data.pinEnabled);
        setContacts(data.notfallkontakte ?? []);
        setReminderTimes(data.reminder_times ?? ["10:00", "15:00", "21:00"]);
      }

      if (UI_FEATURES.habits) {
        const habitsRes = await fetch("/api/habits");
        const habitsPayload = await habitsRes.json();
        if (habitsRes.ok) {
          setHabits(habitsPayload.habits ?? []);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function saveSettings(body: Record<string, unknown>) {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.error ?? "Speichern fehlgeschlagen");
        return false;
      }
      setPinEnabled(payload.pinEnabled);
      setContacts(payload.notfallkontakte ?? []);
      setReminderTimes(payload.reminder_times ?? reminderTimes);
      setMessage("Gespeichert");
      return true;
    } catch {
      setMessage("Netzwerkfehler");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handlePinToggle(enabled: boolean) {
    if (!enabled) {
      clearPinUnlocked();
      await saveSettings({ disablePin: true });
      setNewPin("");
      setConfirmPin("");
      return;
    }
    setPinEnabled(true);
  }

  async function handleSavePin() {
    if (!/^\d{4}$/.test(newPin)) {
      setMessage("PIN muss 4 Ziffern haben");
      return;
    }
    if (newPin !== confirmPin) {
      setMessage("PIN und Bestätigung stimmen nicht überein");
      return;
    }
    const ok = await saveSettings({ pin: newPin });
    if (ok) {
      setNewPin("");
      setConfirmPin("");
    }
  }

  async function handleSaveContacts() {
    await saveSettings({ notfallkontakte: contacts });
  }

  async function handleSaveReminders() {
    await saveSettings({ reminder_times: reminderTimes });
  }

  function addContact() {
    setContacts((prev) => [...prev, { name: "", phone: "" }]);
  }

  function updateContact(index: number, field: keyof Contact, value: string) {
    setContacts((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function removeContact(index: number) {
    setContacts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleAddHabit() {
    if (!newHabit.name.trim()) return;
    setSaving(true);
    try {
      const response = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newHabit.name.trim(),
          beschreibung: newHabit.beschreibung.trim() || null,
          target_minutes: newHabit.target_minutes,
        }),
      });
      if (response.ok) {
        setNewHabit({ name: "", beschreibung: "", target_minutes: 5 });
        await loadAll();
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleHabitActive(habit: Habit) {
    await fetch(`/api/habits/${habit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktiv: !habit.aktiv }),
    });
    await loadAll();
    router.refresh();
  }

  async function deleteHabit(id: string) {
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    await loadAll();
    router.refresh();
  }

  function startEditHabit(habit: Habit) {
    setEditingHabitId(habit.id);
    setEditHabit({
      name: habit.name,
      beschreibung: habit.beschreibung ?? "",
      target_minutes: habit.target_minutes ?? 5,
    });
  }

  async function saveEditHabit() {
    if (!editingHabitId) return;
    await fetch(`/api/habits/${editingHabitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editHabit.name.trim(),
        beschreibung: editHabit.beschreibung.trim() || null,
        target_minutes: editHabit.target_minutes,
      }),
    });
    setEditingHabitId(null);
    await loadAll();
    router.refresh();
  }

  async function handleExport() {
    window.location.href = "/api/export-csv";
  }

  async function handleLogout() {
    clearPinUnlocked();
    await signOut();
  }

  if (loading) {
    return <p className="py-12 text-center text-text-secondary">Lädt Einstellungen…</p>;
  }

  return (
    <div className="space-y-8">
      {message ? (
        <p className="text-center text-sm text-primary" role="status">
          {message}
        </p>
      ) : null}

      <section className="space-y-3">
        <SectionHeader>PIN-Lock</SectionHeader>
        <Card className="space-y-4">
          <label className="flex items-center justify-between gap-4">
            <span className="text-text-primary">PIN beim Öffnen abfragen</span>
            <input
              type="checkbox"
              checked={pinEnabled}
              onChange={(e) => handlePinToggle(e.target.checked)}
              className="h-5 w-5 rounded border-accent text-primary"
            />
          </label>
          {pinEnabled ? (
            <div className="space-y-3 border-t border-accent/20 pt-4">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="Neue PIN (4 Ziffern)"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className={inputClass}
              />
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="PIN bestätigen"
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                className={inputClass}
              />
              <PrimaryButton type="button" onClick={handleSavePin} disabled={saving}>
                PIN speichern
              </PrimaryButton>
            </div>
          ) : null}
        </Card>
      </section>

      <section className="space-y-3">
        <SectionHeader>Notfallkontakte</SectionHeader>
        <Card className="space-y-3">
          {contacts.map((contact, index) => (
            <div key={index} className="space-y-2 rounded-xl bg-bg p-3">
              <input
                placeholder="Name"
                value={contact.name}
                onChange={(e) => updateContact(index, "name", e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="Telefon"
                value={contact.phone}
                onChange={(e) => updateContact(index, "phone", e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeContact(index)}
                className="text-sm text-warning"
              >
                Entfernen
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addContact}
            className="flex min-h-touch w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-accent/50 text-text-secondary"
          >
            <Plus className="h-5 w-5" /> Kontakt hinzufügen
          </button>
          <PrimaryButton type="button" onClick={handleSaveContacts} disabled={saving}>
            Kontakte speichern
          </PrimaryButton>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionHeader>Erinnerungszeiten</SectionHeader>
        <Card className="space-y-3">
          {reminderTimes.map((time, index) => (
            <label key={index} className="block space-y-1">
              <span className="text-sm text-text-secondary">Erinnerung {index + 1}</span>
              <input
                type="time"
                value={time}
                onChange={(e) =>
                  setReminderTimes((prev) =>
                    prev.map((t, i) => (i === index ? e.target.value : t))
                  )
                }
                className={inputClass}
              />
            </label>
          ))}
          <p className="text-xs text-text-secondary">
            Erinnerungen funktionieren nur, wenn App zum Home-Bildschirm hinzugefügt wurde.
          </p>
          <PrimaryButton type="button" onClick={handleSaveReminders} disabled={saving}>
            Zeiten speichern
          </PrimaryButton>
        </Card>
      </section>

      {UI_FEATURES.habits ? (
      <section className="space-y-3">
        <SectionHeader>Habits (Tagesrituale)</SectionHeader>
        <Card className="space-y-3">
          {habits.map((habit) => (
            <div key={habit.id} className="rounded-xl border border-accent/20 p-3">
              {editingHabitId === habit.id ? (
                <div className="space-y-2">
                  <input
                    value={editHabit.name}
                    onChange={(e) => setEditHabit((h) => ({ ...h, name: e.target.value }))}
                    className={inputClass}
                  />
                  <input
                    value={editHabit.beschreibung}
                    onChange={(e) =>
                      setEditHabit((h) => ({ ...h, beschreibung: e.target.value }))
                    }
                    placeholder="Beschreibung"
                    className={inputClass}
                  />
                  <input
                    type="number"
                    value={editHabit.target_minutes}
                    onChange={(e) =>
                      setEditHabit((h) => ({
                        ...h,
                        target_minutes: Number(e.target.value),
                      }))
                    }
                    className={inputClass}
                  />
                  <PrimaryButton type="button" onClick={saveEditHabit}>
                    Speichern
                  </PrimaryButton>
                </div>
              ) : (
                <>
                  <p className="font-medium text-text-primary">{habit.name}</p>
                  {habit.beschreibung ? (
                    <p className="text-sm text-text-secondary">{habit.beschreibung}</p>
                  ) : null}
                  <p className="text-xs text-text-secondary">
                    ca. {habit.target_minutes ?? "–"} Min
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEditHabit(habit)}
                      className="text-sm text-primary underline"
                    >
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleHabitActive(habit)}
                      className="text-sm text-text-secondary underline"
                    >
                      {habit.aktiv ? "Deaktivieren" : "Aktivieren"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteHabit(habit.id)}
                      className="inline-flex items-center gap-1 text-sm text-warning"
                    >
                      <Trash2 className="h-3 w-3" /> Löschen
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          <div className="space-y-2 border-t border-accent/20 pt-4">
            <p className="text-sm font-medium text-text-primary">Neues Habit</p>
            <input
              placeholder="Name"
              value={newHabit.name}
              onChange={(e) => setNewHabit((h) => ({ ...h, name: e.target.value }))}
              className={inputClass}
            />
            <input
              placeholder="Beschreibung"
              value={newHabit.beschreibung}
              onChange={(e) => setNewHabit((h) => ({ ...h, beschreibung: e.target.value }))}
              className={inputClass}
            />
            <input
              type="number"
              placeholder="Dauer (Min)"
              value={newHabit.target_minutes}
              onChange={(e) =>
                setNewHabit((h) => ({ ...h, target_minutes: Number(e.target.value) }))
              }
              className={inputClass}
            />
            <PrimaryButton type="button" onClick={handleAddHabit} disabled={saving}>
              Habit hinzufügen
            </PrimaryButton>
          </div>
        </Card>
      </section>
      ) : null}

      <section className="space-y-3">
        <SectionHeader>Daten</SectionHeader>
        <Card>
          <PrimaryButton type="button" onClick={handleExport}>
            Alle Daten als CSV exportieren
          </PrimaryButton>
        </Card>
      </section>

      <button
        type="button"
        onClick={handleLogout}
        className="mx-auto block w-full py-4 text-center text-sm text-text-secondary underline"
      >
        Abmelden
      </button>
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-accent/40 bg-white px-4 py-3 text-text-primary shadow-soft outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";
