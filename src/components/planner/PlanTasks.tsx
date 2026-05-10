import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { usePlannerRows, usePlannerConfig, isPosted } from "@/lib/planner";

const ALL = "__all__";

export function PlanTasks() {
  const [rows] = usePlannerRows();
  const { config: PLANNER_CONFIG } = usePlannerConfig();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [postFrom, setPostFrom] = useState("");
  const [postTo, setPostTo] = useState("");
  const [contentType, setContentType] = useState(ALL);
  const [assignee, setAssignee] = useState(ALL);
  const [platform, setPlatform] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [format, setFormat] = useState(ALL);
  const [goal, setGoal] = useState(ALL);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (from && (!r.demoDate || r.demoDate < from)) return false;
      if (to && (!r.demoDate || r.demoDate > to)) return false;
      if (postFrom && (!r.postDate || r.postDate < postFrom)) return false;
      if (postTo && (!r.postDate || r.postDate > postTo)) return false;
      if (contentType !== ALL && r.contentType !== contentType) return false;
      if (assignee !== ALL && r.assignee !== assignee) return false;
      if (platform !== ALL && r.platform !== platform) return false;
      if (status !== ALL && r.status !== status) return false;
      if (format !== ALL && r.format !== format) return false;
      if (goal !== ALL && r.goal !== goal) return false;
      return true;
    });
  }, [rows, from, to, postFrom, postTo, contentType, assignee, platform, status, format, goal]);

  const total = rows.length;
  const posted = rows.filter(isPosted).length;

  const today = new Date(); today.setHours(0,0,0,0);
  const todayKey = today.toISOString().slice(0,10);
  const tomorrowKey = new Date(today.getTime() + 86400000).toISOString().slice(0,10);
  const overdue = rows.filter((r) => r.postDate && r.postDate < todayKey && !isPosted(r));
  const todays = rows.filter((r) => r.postDate === todayKey);
  const tomorrows = rows.filter((r) => r.postDate === tomorrowKey);

  const filterDef: { label: string; value: string; setter: (v: string) => void; options: string[] }[] = [
    { label: "CONTENT TYPE", value: contentType, setter: setContentType, options: PLANNER_CONFIG.contentTypes as unknown as string[] },
    { label: "ASSIGNEE", value: assignee, setter: setAssignee, options: PLANNER_CONFIG.assignees as unknown as string[] },
    { label: "PLATFORM", value: platform, setter: setPlatform, options: PLANNER_CONFIG.platforms as unknown as string[] },
    { label: "STATUS", value: status, setter: setStatus, options: PLANNER_CONFIG.statuses as unknown as string[] },
    { label: "FORMAT", value: format, setter: setFormat, options: PLANNER_CONFIG.formats as unknown as string[] },
    { label: "GOAL", value: goal, setter: setGoal, options: PLANNER_CONFIG.goals as unknown as string[] },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">🚀 Filtered posts</p>
          <p className="mt-1 font-display text-3xl font-semibold">{filtered.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total content</p>
          <p className="mt-1 font-display text-3xl font-semibold">{total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total posted</p>
          <p className="mt-1 font-display text-3xl font-semibold text-growth">{posted}</p>
        </Card>
      </div>

      <Card className="p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Filters</p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <DateRange label="Demo date" from={from} to={to} setFrom={setFrom} setTo={setTo} />
          <DateRange label="Post date" from={postFrom} to={postTo} setFrom={setPostFrom} setTo={setPostTo} />
          {filterDef.map((f) => (
            <div key={f.label}>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</label>
              <Select value={f.value} onValueChange={f.setter}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL} className="text-xs">— All —</SelectItem>
                  {f.options.map((o) => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <TaskList title="🔴 Overdue" items={overdue} tone="text-destructive" />
        <TaskList title="📌 Today" items={todays} tone="text-growth" />
        <TaskList title="📅 Tomorrow" items={tomorrows} tone="text-insight" />
      </div>

      <Card className="p-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Results ({filtered.length})</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase text-muted-foreground">
              <tr>
                <th className="px-2 py-1.5 text-left">Title</th>
                <th className="px-2 py-1.5 text-left">Status</th>
                <th className="px-2 py-1.5 text-left">Platform</th>
                <th className="px-2 py-1.5 text-left">Format</th>
                <th className="px-2 py-1.5 text-left">Post date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border/40">
                  <td className="px-2 py-1.5">{r.title}</td>
                  <td className="px-2 py-1.5">{r.status}</td>
                  <td className="px-2 py-1.5">{r.platform}</td>
                  <td className="px-2 py-1.5">{r.format}</td>
                  <td className="px-2 py-1.5 font-mono">{r.postDate || "-"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-2 py-6 text-center text-muted-foreground">No results.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function DateRange({ label, from, to, setFrom, setTo }: { label: string; from: string; to: string; setFrom: (v: string) => void; setTo: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="mt-1 flex gap-1">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 text-xs" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 text-xs" />
      </div>
    </div>
  );
}

function TaskList({ title, items, tone }: { title: string; items: { id: string; title: string; postDate?: string }[]; tone: string }) {
  return (
    <Card className="p-4">
      <p className={`text-xs font-semibold ${tone}`}>{title} ({items.length})</p>
      <ul className="mt-2 space-y-1 text-xs">
        {items.length === 0 && <li className="text-muted-foreground">—</li>}
        {items.map((r) => (
          <li key={r.id} className="flex justify-between gap-2">
            <span className="truncate">{r.title || "(no title)"}</span>
            <span className="font-mono text-muted-foreground">{r.postDate}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
