import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContents, type ContentItem, type Status, type Platform } from "@/lib/storage";
import { Link } from "@tanstack/react-router";
import { PenLine, GripVertical } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Plan — Growth Lab" },
      { name: "description", content: "Calendar + Kanban content planner." },
    ],
  }),
  component: PlanPage,
});

const columns: { key: Status; label: string; tone: string }[] = [
  { key: "idea", label: "Idea", tone: "bg-accent text-accent-foreground" },
  { key: "draft", label: "Draft", tone: "bg-insight/15 text-insight" },
  { key: "scheduled", label: "Scheduled", tone: "bg-chart-3/15 text-foreground" },
  { key: "posted", label: "Posted", tone: "bg-growth/20 text-foreground" },
];

const platforms: (Platform | "all")[] = ["all", "Facebook", "Instagram", "TikTok", "LinkedIn", "Threads", "YouTube"];

function PlanPage() {
  const [contents, setContents] = useContents();
  const [view, setView] = useState<"kanban" | "week">("kanban");
  const [filter, setFilter] = useState<Platform | "all">("all");
  const [drag, setDrag] = useState<string | null>(null);

  const items = contents.filter((c) => filter === "all" || c.platform === filter);

  const move = (id: string, status: Status) => {
    setContents((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status, postedAt: status === "posted" ? Date.now() : c.postedAt }
          : c
      )
    );
    toast.success(`Đã chuyển sang ${status}`);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Content Planner"
        title="Lịch và pipeline, một nơi."
        description="Kéo thả qua các trạng thái. Lọc theo channel để thấy nhịp riêng từng nền tảng."
      >
        <div className="inline-flex rounded-md border border-border bg-surface p-1">
          {(["kanban", "week"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded px-3 py-1.5 text-xs font-medium capitalize transition ${
                view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {v === "kanban" ? "Kanban" : "Tuần"}
            </button>
          ))}
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as Platform | "all")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {platforms.map((p) => (
              <SelectItem key={p} value={p}>{p === "all" ? "Tất cả channel" : p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild className="gap-2">
          <Link to="/execute"><PenLine className="h-4 w-4" /> Tạo content</Link>
        </Button>
      </PageHeader>

      <div className="px-6 py-8 md:px-10">
        {view === "kanban" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {columns.map((col) => {
              const colItems = items.filter((c) => c.status === col.key);
              return (
                <div
                  key={col.key}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (drag) {
                      move(drag, col.key);
                      setDrag(null);
                    }
                  }}
                  className="rounded-xl border border-border/60 bg-surface/60 p-3"
                >
                  <div className="mb-3 flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={col.tone}>{col.label}</Badge>
                      <span className="text-xs text-muted-foreground">{colItems.length}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 min-h-32">
                    {colItems.map((c) => (
                      <KanbanCard key={c.id} item={c} onDragStart={() => setDrag(c.id)} />
                    ))}
                    {colItems.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                        Thả vào đây
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <WeekView items={items} />
        )}
      </div>
    </div>
  );
}

function KanbanCard({ item, onDragStart }: { item: ContentItem; onDragStart: () => void }) {
  return (
    <Link
      to="/execute"
      search={{ id: item.id }}
      draggable
      onDragStart={onDragStart}
      className="group block cursor-grab rounded-lg border border-border/60 bg-card p-3 shadow-soft transition hover:shadow-lift active:cursor-grabbing"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {item.platform} · {item.format}
          </p>
          <p className="mt-1 line-clamp-2 font-display text-sm leading-snug">{item.title}</p>
          <div className="mt-2 flex items-center justify-between">
            <Badge variant="outline" className="text-[10px]">{item.goal}</Badge>
            {item.scheduledAt && (
              <span className="text-[10px] text-muted-foreground">
                {new Date(item.scheduledAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "short" })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function WeekView({ items }: { items: ContentItem[] }) {
  const today = new Date();
  const day = today.getDay() || 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day - 1));
  monday.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  return (
    <div className="grid gap-3 md:grid-cols-7">
      {days.map((d) => {
        const dayItems = items.filter((c) => {
          const t = c.scheduledAt ?? c.postedAt;
          if (!t) return false;
          const cd = new Date(t);
          return cd.toDateString() === d.toDateString();
        });
        const isToday = d.toDateString() === today.toDateString();
        return (
          <Card key={d.toISOString()} className={`border-border/60 p-3 ${isToday ? "ring-2 ring-growth" : ""}`}>
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl font-semibold">{d.getDate()}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {d.toLocaleDateString("en", { weekday: "short" })}
              </span>
            </div>
            <div className="mt-3 space-y-1.5">
              {dayItems.map((c) => (
                <Link
                  key={c.id}
                  to="/execute"
                  search={{ id: c.id }}
                  className="block rounded-md bg-surface px-2 py-1.5 text-xs leading-snug hover:bg-accent"
                >
                  <span className="text-[9px] font-semibold uppercase text-insight">{c.platform}</span>
                  <p className="line-clamp-2">{c.title}</p>
                </Link>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
