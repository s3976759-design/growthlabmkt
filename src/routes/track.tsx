import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { useContents, engagementRate, type ContentItem } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track — Growth Lab" },
      { name: "description", content: "Nhập số liệu, tự tính engagement rate, highlight bài tốt." },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const [contents, setContents] = useContents();
  const posted = contents
    .filter((c) => c.status === "posted")
    .sort((a, b) => (b.postedAt ?? 0) - (a.postedAt ?? 0));

  const withEr = posted.map((c) => ({ c, er: engagementRate(c) }));
  const maxEr = Math.max(0, ...withEr.map((x) => x.er));

  const updateMetric = (id: string, field: keyof NonNullable<ContentItem["metrics"]>, value: number) => {
    setContents((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const metrics = { reach: 0, engagement: 0, saves: 0, shares: 0, ...(c.metrics ?? {}) };
        metrics[field] = Math.max(0, value);
        return { ...c, metrics };
      })
    );
  };

  const setScore = (id: string, score: number) => {
    setContents((prev) => prev.map((c) => (c.id === id ? { ...c, score } : c)));
    toast.success(`Đã chấm ${score}/5`);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Performance Tracker"
        title="Số liệu là sự thật."
        description="Nhập reach, engagement, saves, shares. Lab tự tính ER và tìm bài top."
      />

      <div className="px-6 py-8 md:px-10">
        {posted.length === 0 ? (
          <Card className="border-dashed bg-surface/50 p-12 text-center">
            <p className="font-display text-xl">Chưa có bài nào ở trạng thái Posted.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Vào Plan, kéo bài sang cột Posted để bắt đầu đo.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft">
            <div className="hidden md:grid grid-cols-[2fr_repeat(4,90px)_120px_140px] gap-3 border-b border-border/60 bg-surface px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <div>Bài</div>
              <div className="text-right">Reach</div>
              <div className="text-right">Engage</div>
              <div className="text-right">Saves</div>
              <div className="text-right">Shares</div>
              <div className="text-right">ER</div>
              <div>Score</div>
            </div>
            <div className="divide-y divide-border/60">
              {withEr.map(({ c, er }) => {
                const isTop = er > 0 && er === maxEr;
                const m = c.metrics ?? { reach: 0, engagement: 0, saves: 0, shares: 0 };
                return (
                  <div key={c.id} className={`grid grid-cols-1 md:grid-cols-[2fr_repeat(4,90px)_120px_140px] gap-3 px-5 py-4 ${isTop ? "bg-growth/8" : ""}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        {isTop && <Badge className="bg-growth text-growth-foreground">Top</Badge>}
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {c.platform} · {c.format} · {c.goal}
                        </span>
                      </div>
                      <p className="mt-1 font-display text-base leading-snug">{c.title}</p>
                    </div>
                    <NumCell value={m.reach} onChange={(v) => updateMetric(c.id, "reach", v)} />
                    <NumCell value={m.engagement} onChange={(v) => updateMetric(c.id, "engagement", v)} />
                    <NumCell value={m.saves} onChange={(v) => updateMetric(c.id, "saves", v)} />
                    <NumCell value={m.shares} onChange={(v) => updateMetric(c.id, "shares", v)} />
                    <div className="flex items-center justify-end">
                      <span className={`font-display text-2xl font-semibold ${er > 5 ? "text-growth" : ""}`}>
                        {er.toFixed(1)}
                        <span className="text-xs text-muted-foreground">%</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => setScore(c.id, n)}>
                          <Star
                            className={`h-4 w-4 transition ${
                              (c.score ?? 0) >= n ? "fill-insight text-insight" : "text-muted-foreground/30"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NumCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Input
      type="number"
      min={0}
      value={value || ""}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="h-9 text-right tabular-nums"
      placeholder="0"
    />
  );
}
