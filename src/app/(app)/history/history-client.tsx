"use client";

import { clsx } from "clsx";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { HistoryLineChart, type ChartPoint } from "@/components/history/HistoryLineChart";
import { HistoryRankedList } from "@/components/history/HistoryRankedList";
import { SectionHeader } from "@/components/SectionHeader";
import { UI_FEATURES } from "@/lib/features";
import type { HistoryRange, RankedInsightItem } from "@/lib/history/analytics";

type HistoryData = {
  range: HistoryRange;
  chartPoints: ChartPoint[];
  stressors: RankedInsightItem[];
  notSpiraling: RankedInsightItem[];
  helpfulSkills: { name: string; count: number }[];
  breathRitual: {
    days: { date: string; label: string; completed: boolean }[];
    completedCount: number;
  };
};

const TABS: { id: HistoryRange; label: string }[] = [
  { id: "week", label: "Woche" },
  { id: "month", label: "Monat" },
  { id: "all", label: "Alles" },
];

export function HistoryClient() {
  const [range, setRange] = useState<HistoryRange>("week");
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (selectedRange: HistoryRange) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/history?range=${selectedRange}`);
      const payload = await response.json();
      if (response.ok) {
        setData(payload as HistoryData);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(range);
  }, [range, loadData]);

  return (
    <>
      <h1 className="text-2xl font-semibold text-text-primary">Verlauf</h1>

      <div className="mt-6 flex gap-2 rounded-2xl bg-white p-1 shadow-soft">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRange(tab.id)}
            className={clsx(
              "flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors duration-200 ease-gentle",
              range === tab.id
                ? "bg-primary text-white"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-12 text-center text-text-secondary">Lädt Verlauf…</p>
      ) : data ? (
        <div className="mt-8 space-y-8">
          <Card className="p-4">
            <SectionHeader>Anspannung im Verlauf</SectionHeader>
            <div className="mt-4 w-full min-w-0 overflow-hidden">
              <HistoryLineChart data={data.chartPoints} />
            </div>
          </Card>

          <Card className="min-w-0 p-5">
            <SectionHeader>Stressors</SectionHeader>
            <div className="mt-4 min-w-0 overflow-hidden">
              <HistoryRankedList items={data.stressors} barColor="#C97B7B" />
            </div>
          </Card>

          <Card className="min-w-0 p-5">
            <SectionHeader>Not Spiraling For Once</SectionHeader>
            <div className="mt-4 min-w-0 overflow-hidden">
              <HistoryRankedList
                items={data.notSpiraling}
                barColor="#7BA7C9"
              />
            </div>
          </Card>

          <section className="space-y-3">
            <SectionHeader>Skills, die geholfen haben</SectionHeader>
            {data.helpfulSkills.length > 0 ? (
              <div className="space-y-2">
                {data.helpfulSkills.map((skill) => (
                  <Card key={skill.name} className="flex items-center justify-between p-4">
                    <p className="font-medium text-text-primary">{skill.name}</p>
                    <span className="text-sm text-text-secondary">{skill.count}×</span>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <p className="text-sm text-text-secondary">
                  Noch keine Skills als hilfreich markiert.
                </p>
              </Card>
            )}
          </section>

          {UI_FEATURES.breathRitualHistory ? (
            <section className="space-y-3">
              <SectionHeader>Atem-Ritual diese Woche</SectionHeader>
              <Card className="p-4">
                <p className="text-text-primary">
                  <span className="text-2xl font-semibold text-primary">
                    {data.breathRitual.completedCount}
                  </span>
                  <span className="text-text-secondary"> / 7 Tage</span>
                </p>
                <div className="mt-4 flex justify-between gap-2">
                  {data.breathRitual.days.map((day) => (
                    <div key={day.date} className="flex flex-col items-center gap-1">
                      <span
                        className={clsx(
                          "flex h-8 w-8 items-center justify-center rounded-full border-2",
                          day.completed
                            ? "border-primary bg-primary text-white"
                            : "border-accent/50 bg-white"
                        )}
                        aria-label={day.completed ? "Erledigt" : "Offen"}
                      >
                        {day.completed ? "✓" : ""}
                      </span>
                      <span className="text-[10px] text-text-secondary">
                        {day.label}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
