import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePlannerRows } from "@/lib/planner";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function PlanCalendar() {
  const [rows] = usePlannerRows();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthName = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const arr: { date: Date | null }[] = [];
    for (let i = 0; i < startOffset; i++) arr.push({ date: null });
    for (let d = 1; d <= lastDay; d++) arr.push({ date: new Date(year, month, d) });
    while (arr.length % 7) arr.push({ date: null });
    return arr;
  }, [year, month]);

  const byDate = useMemo(() => {
    const map: Record<string, typeof rows> = {};
    rows.forEach((r) => {
      if (!r.postDate) return;
      (map[r.postDate] ||= []).push(r);
    });
    return map;
  }, [rows]);

  const today = new Date(); today.setHours(0,0,0,0);
  const todayKey = today.toISOString().slice(0, 10);
  const todayItems = byDate[todayKey] ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">🗓️ Posting calendar</p>
          <h2 className="font-display text-2xl capitalize">{monthName}</h2>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="outline" onClick={() => setCursor(new Date(year, month - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }}>
            Today
          </Button>
          <Button size="icon" variant="outline" onClick={() => setCursor(new Date(year, month + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border/60 bg-border/60 text-xs">
        {DAYS.map((d) => (
          <div key={d} className="bg-surface px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((c, i) => {
          if (!c.date) return <div key={i} className="min-h-24 bg-card/40" />;
          const key = c.date.toISOString().slice(0, 10);
          const items = byDate[key] ?? [];
          const isToday = key === todayKey;
          return (
            <div key={i} className={`min-h-24 bg-card p-1.5 ${isToday ? "ring-2 ring-inset ring-growth" : ""}`}>
              <div className="mb-1 flex items-center justify-between">
                <span className={`font-display text-sm ${isToday ? "font-semibold text-growth" : ""}`}>{c.date.getDate()}</span>
                {items.length > 0 && (
                  <span className="rounded-full bg-insight/15 px-1.5 text-[9px] font-medium text-insight">{items.length}</span>
                )}
              </div>
              <div className="space-y-0.5">
                {items.slice(0, 3).map((r) => (
                  <div key={r.id} className="truncate rounded bg-accent/60 px-1 py-0.5 text-[10px]" title={r.title}>
                    {r.platform.split(" ")[0]} {r.title || "(no title)"}
                  </div>
                ))}
                {items.length > 3 && (
                  <div className="text-[9px] text-muted-foreground">+{items.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">✍️ Today's posts</p>
        {todayItems.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No posts today.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {todayItems.map((r) => (
              <li key={r.id} className="flex items-center gap-2 text-sm">
                <span className="font-mono text-xs text-muted-foreground">{r.postTime || "--:--"}</span>
                <span className="text-xs text-insight">{r.platform.split(" ")[0]}</span>
                <span>{r.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">{r.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
