import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useContents, useIdeas, useWeeklyGoal, engagementRate } from "@/lib/storage";
import { ArrowRight, Lightbulb, PenLine, TrendingUp, Target, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { DateTimeWidget } from "@/components/DateTimeWidget";
import { useT } from "@/lib/i18n";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Growth Lab" },
      { name: "description", content: "Tổng quan content tuần này, top bài, weekly goal." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [contents] = useContents();
  const [ideas] = useIdeas();
  const [goal, setGoal] = useWeeklyGoal();
  const t = useT();

  const weekStart = useMemo(() => {
    const d = new Date();
    const day = d.getDay() || 7;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (day - 1));
    return d.getTime();
  }, []);

  const postedThisWeek = contents.filter(
    (c) => c.status === "posted" && (c.postedAt ?? 0) >= weekStart
  );
  const allPosted = contents.filter((c) => c.status === "posted");
  const top = [...allPosted]
    .map((c) => ({ c, er: engagementRate(c) }))
    .sort((a, b) => b.er - a.er)
    .slice(0, 3);

  const goalPct = Math.min(100, Math.round((postedThisWeek.length / Math.max(1, goal)) * 100));

  return (
    <div>
      <PageHeader
        eyebrow={t("dash.eyebrow")}
        title={t("dash.title")}
        description={t("dash.desc")}
      >
        <Button asChild variant="default" className="gap-2">
          <Link to="/execute">
            <PenLine className="h-4 w-4" /> {t("dash.write")}
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/brain">
            <Lightbulb className="h-4 w-4" /> {t("dash.addIdea")}
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-5 px-6 py-8 md:px-10 lg:grid-cols-3">
        <DateTimeWidget />
        <Card className="border-border/60 bg-card/80 p-5 shadow-soft backdrop-blur-md lg:col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{t("dash.quickLinks")}</p>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <Link to="/settings" className="text-foreground/80 hover:text-foreground">→ {t("nav.settings")}</Link>
            <Link to="/ai-writer" className="text-foreground/80 hover:text-foreground">→ {t("nav.aiwriter")}</Link>
            <Link to="/plan" className="text-foreground/80 hover:text-foreground">→ {t("nav.plan")}</Link>
            <Link to="/hub" className="text-foreground/80 hover:text-foreground">→ {t("nav.hub")}</Link>
          </div>
        </Card>

        {/* Weekly goal */}
        <Card className="relative overflow-hidden border-border/60 bg-card p-6 shadow-soft lg:col-span-2">
          <div className="absolute inset-0 grid-paper opacity-40" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-insight" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Weekly Goal
                </span>
              </div>
              <input
                type="number"
                min={1}
                value={goal}
                onChange={(e) => setGoal(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 rounded-md border border-input bg-background px-2 py-1 text-right text-sm"
              />
            </div>
            <div className="mt-4 flex items-end gap-3">
              <span className="font-display text-6xl font-semibold leading-none tracking-tight">
                {postedThisWeek.length}
              </span>
              <span className="pb-2 text-lg text-muted-foreground">/ {goal} bài</span>
            </div>
            <Progress value={goalPct} className="mt-5 h-2" />
            <p className="mt-3 text-sm text-muted-foreground">
              {goalPct >= 100
                ? "🎉 Bé đã chạm goal tuần này. Giờ là lúc nhìn lại insight."
                : `Còn ${Math.max(0, goal - postedThisWeek.length)} bài để chạm mục tiêu.`}
            </p>
          </div>
        </Card>

        <Card className="border-border/60 bg-insight-gradient p-6 text-insight-foreground shadow-soft">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">
              Brain
            </span>
          </div>
          <p className="mt-4 font-display text-5xl font-semibold">{ideas.length}</p>
          <p className="mt-1 text-sm opacity-90">ý tưởng đang chờ được biến thành content</p>
          <Button asChild variant="secondary" size="sm" className="mt-5 gap-1.5 bg-white/15 text-insight-foreground hover:bg-white/25">
            <Link to="/brain">
              Mở Brain <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </Card>

        <Card className="border-border/60 bg-card p-6 shadow-soft lg:col-span-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-growth" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Top performing
              </span>
            </div>
            <Link to="/track" className="text-xs text-muted-foreground hover:text-foreground">
              Xem tất cả →
            </Link>
          </div>

          {top.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-border/80 p-10 text-center">
              <p className="font-display text-lg">Chưa có data hiệu năng.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Đăng bài, nhập số liệu, lab sẽ tự highlight bài tốt nhất.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/track">Vào Tracker</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {top.map(({ c, er }, i) => (
                <div
                  key={c.id}
                  className="group relative overflow-hidden rounded-lg border border-border/60 bg-surface p-5 transition hover:shadow-lift"
                >
                  <span className="absolute right-3 top-3 font-display text-3xl font-semibold text-muted-foreground/30">
                    0{i + 1}
                  </span>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-insight">
                    {c.platform} · {c.format}
                  </p>
                  <p className="mt-2 line-clamp-2 font-display text-lg leading-snug">{c.title}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-display text-2xl font-semibold text-growth">
                      {er.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">ER</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
