import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { usePlannerRows } from "@/lib/planner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#84cc16", "#f97316", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6", "#eab308", "#ef4444", "#6366f1", "#22c55e"];

function group<T>(arr: T[], key: (t: T) => string) {
  const m = new Map<string, number>();
  arr.forEach((it) => {
    const k = key(it);
    m.set(k, (m.get(k) ?? 0) + 1);
  });
  return Array.from(m, ([name, value]) => ({ name, value }));
}

export function PlanOverview() {
  const [rows] = usePlannerRows();

  const byPlatform = useMemo(() => group(rows, (r) => r.platform), [rows]);
  const byAssignee = useMemo(() => group(rows, (r) => r.assignee), [rows]);
  const byStatus = useMemo(() => group(rows, (r) => r.status), [rows]);
  const byFormat = useMemo(() => group(rows, (r) => r.format), [rows]);
  const byGoal = useMemo(() => group(rows, (r) => r.goal), [rows]);

  const totals = useMemo(() => {
    let views = 0, inter = 0, shares = 0, saves = 0;
    rows.forEach((r) => {
      views += r.views ?? 0;
      inter += r.interactions ?? 0;
      shares += r.shares ?? 0;
      saves += r.saves ?? 0;
    });
    return { views, inter, shares, saves };
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Total views" value={totals.views} />
        <Stat label="Interactions" value={totals.inter} />
        <Stat label="Shares" value={totals.shares} />
        <Stat label="Saves" value={totals.saves} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Content count by platform">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byPlatform}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#84cc16" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribution by assignee">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byAssignee} dataKey="value" nameKey="name" outerRadius={80} label>
                {byAssignee.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Status">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byStatus} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={140} />
              <Tooltip />
              <Bar dataKey="value" fill="#f97316" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Format & goal">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={[...byFormat, ...byGoal.map((g) => ({ name: `🎯 ${g.name}`, value: g.value }))]}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold">{value.toLocaleString()}</p>
    </Card>
  );
}
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </Card>
  );
}
