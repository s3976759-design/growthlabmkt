import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useT } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Award, Target, Zap } from "lucide-react";
import { useContents, useWeeklyGoal, engagementRate, type ContentItem } from "@/lib/storage";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Review — Growth Lab" },
      { name: "description", content: "Tổng kết tuần, top bài, insight tự sinh." },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const t = useT();
  const [contents] = useContents();
  const [goal] = useWeeklyGoal();

  const weekStart = useMemo(() => {
    const d = new Date();
    const day = d.getDay() || 7;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (day - 1));
    return d.getTime();
  }, []);

  const posted = contents.filter((c) => c.status === "posted");
  const thisWeek = posted.filter((c) => (c.postedAt ?? 0) >= weekStart);
  const withEr = posted.map((c) => ({ c, er: engagementRate(c) })).filter((x) => x.er > 0);
  const top3 = [...withEr].sort((a, b) => b.er - a.er).slice(0, 3);

  const insights = generateInsights(posted);
  const goalPct = Math.min(100, Math.round((thisWeek.length / Math.max(1, goal)) * 100));

  return (
    <div>
      <PageHeader
        eyebrow="Weekly Review"
        title="Nhìn lại để đi xa hơn."
        description="Lab đọc số liệu của bé và rút ra điều quan trọng nhất."
      />

      <div className="grid gap-5 px-6 py-8 md:px-10 lg:grid-cols-4">
        <Stat icon={Target} label="Goal đạt" value={`${goalPct}%`} sub={`${thisWeek.length}/${goal} bài`} />
        <Stat icon={TrendingUp} label="Posted tuần này" value={thisWeek.length.toString()} sub={`Tổng: ${posted.length}`} />
        <Stat
          icon={Zap}
          label="ER trung bình"
          value={withEr.length ? `${(withEr.reduce((s, x) => s + x.er, 0) / withEr.length).toFixed(1)}%` : "—"}
          sub={`Trên ${withEr.length} bài có data`}
        />
        <Stat
          icon={Award}
          label="Bài tốt nhất"
          value={top3[0] ? `${top3[0].er.toFixed(1)}%` : "—"}
          sub={top3[0]?.c.title.slice(0, 40) ?? "Chưa có"}
        />

        {/* Insights */}
        <Card className="relative overflow-hidden border-border/60 bg-insight-gradient p-7 text-insight-foreground shadow-lift lg:col-span-2 lg:row-span-2">
          <div className="absolute inset-0 grid-paper opacity-20" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-80">
                Insight Engine
              </span>
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold">
              {insights.length} điều lab học được.
            </h2>

            {insights.length === 0 ? (
              <p className="mt-6 opacity-90">
                Cần ít nhất 3 bài có data để rút insight. Tiếp tục đăng & nhập số nhé.
              </p>
            ) : (
              <ul className="mt-6 space-y-4">
                {insights.map((it, i) => (
                  <li key={i} className="border-l-2 border-white/40 pl-4">
                    <p className="font-display text-lg leading-snug">{it.headline}</p>
                    <p className="mt-1 text-sm opacity-85">{it.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Top 3 */}
        <Card className="border-border/60 bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-growth" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Top 3 bài
            </span>
          </div>
          {top3.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Chưa có data hiệu năng.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {top3.map(({ c, er }, i) => (
                <li key={c.id} className="flex items-start gap-4 rounded-lg bg-surface p-4">
                  <span className="font-display text-3xl font-semibold text-muted-foreground/40">
                    0{i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-insight">
                      {c.platform} · {c.format}
                    </p>
                    <p className="mt-0.5 font-display text-base leading-snug">{c.title}</p>
                  </div>
                  <span className="font-display text-2xl font-semibold text-growth">{er.toFixed(1)}%</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="border-border/60 bg-surface/60 p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Distribution
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {distribution(posted).map(([key, count, pct]) => (
              <div key={key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{key}</span>
                  <span className="text-muted-foreground">{count} bài</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-growth-gradient" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
            {posted.length === 0 && (
              <p className="text-sm text-muted-foreground">Chưa có bài posted.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon, label, value, sub,
}: { icon: React.ElementType; label: string; value: string; sub: string }) {
  return (
    <Card className="border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-3 font-display text-4xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

function distribution(items: ContentItem[]): [string, number, number][] {
  const counts: Record<string, number> = {};
  items.forEach((c) => {
    const k = `${c.format}`;
    counts[k] = (counts[k] ?? 0) + 1;
  });
  const total = items.length || 1;
  return Object.entries(counts)
    .map(([k, v]) => [k, v, Math.round((v / total) * 100)] as [string, number, number])
    .sort((a, b) => b[1] - a[1]);
}

function generateInsights(items: ContentItem[]) {
  const withEr = items.map((c) => ({ c, er: engagementRate(c) })).filter((x) => x.er > 0);
  if (withEr.length < 3) return [];

  const insights: { headline: string; detail: string }[] = [];

  // By format
  const byFormat: Record<string, number[]> = {};
  withEr.forEach((x) => {
    (byFormat[x.c.format] ??= []).push(x.er);
  });
  const formatAvgs = Object.entries(byFormat)
    .filter(([, arr]) => arr.length >= 1)
    .map(([k, arr]) => ({ k, avg: arr.reduce((s, n) => s + n, 0) / arr.length, count: arr.length }))
    .sort((a, b) => b.avg - a.avg);

  if (formatAvgs.length >= 2) {
    const best = formatAvgs[0];
    const worst = formatAvgs[formatAvgs.length - 1];
    if (best.avg > worst.avg) {
      const lift = ((best.avg - worst.avg) / Math.max(0.1, worst.avg)) * 100;
      insights.push({
        headline: `Format ${best.k} có engagement cao hơn ${lift.toFixed(0)}% so với ${worst.k}.`,
        detail: `Dựa trên ${best.count} bài ${best.k} (avg ER ${best.avg.toFixed(1)}%) so với ${worst.k}. Cân nhắc tăng tỉ trọng ${best.k} trong tuần tới.`,
      });
    }
  }

  // By platform
  const byPlatform: Record<string, number[]> = {};
  withEr.forEach((x) => {
    (byPlatform[x.c.platform] ??= []).push(x.er);
  });
  const platAvgs = Object.entries(byPlatform).map(([k, arr]) => ({
    k, avg: arr.reduce((s, n) => s + n, 0) / arr.length,
  })).sort((a, b) => b.avg - a.avg);
  if (platAvgs.length >= 1) {
    insights.push({
      headline: `${platAvgs[0].k} là kênh "ăn" nhất hiện tại (ER ${platAvgs[0].avg.toFixed(1)}%).`,
      detail: `Trong tất cả các kênh bé đăng, ${platAvgs[0].k} đang giữ engagement rate trung bình cao nhất.`,
    });
  }

  // Top vs avg
  const sorted = [...withEr].sort((a, b) => b.er - a.er);
  const top = sorted[0];
  const avg = withEr.reduce((s, x) => s + x.er, 0) / withEr.length;
  if (top.er > avg * 1.5) {
    insights.push({
      headline: `Bài "${top.c.title.slice(0, 40)}…" gấp ${(top.er / avg).toFixed(1)}× ER trung bình.`,
      detail: `Hãy phân tích hook, format và CTA của bài này. Có thể nhân rộng pattern.`,
    });
  }

  // Goal achievement
  const goalCounts: Record<string, number> = {};
  withEr.forEach((x) => (goalCounts[x.c.goal] = (goalCounts[x.c.goal] ?? 0) + 1));
  const dominant = Object.entries(goalCounts).sort((a, b) => b[1] - a[1])[0];
  if (dominant) {
    insights.push({
      headline: `${dominant[1]}/${withEr.length} bài đang nhắm "${dominant[0]}".`,
      detail: `Kiểm tra xem mục tiêu này có đang phục vụ chiến lược tổng thể không, hay bé đang vô tình dồn quá nhiều vào một hướng.`,
    });
  }

  return insights.slice(0, 4);
}
