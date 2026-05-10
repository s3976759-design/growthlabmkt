import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import {
  usePlannerRows,
  usePlannerConfig,
  emptyRow,
  isPosted,
  type PlannerRow,
  type PlannerConfig,
} from "@/lib/planner";
import { toast } from "sonner";

interface Props {
  /** "active" = not posted, "archive" = posted */
  mode: "active" | "archive";
}

function buildCols(cfg: PlannerConfig) {
  return [
    { key: "title", label: "TITLE / MAIN CONTENT", type: "title" as const },
    { key: "assignee", label: "ASSIGNEE", type: "select" as const, options: cfg.assignees },
    { key: "status", label: "STATUS", type: "select" as const, options: cfg.statuses },
    { key: "contentType", label: "CONTENT TYPE", type: "select" as const, options: cfg.contentTypes },
    { key: "platform", label: "PLATFORM", type: "select" as const, options: cfg.platforms },
    { key: "format", label: "FORMAT", type: "select" as const, options: cfg.formats },
    { key: "goal", label: "GOAL", type: "select" as const, options: cfg.goals },
    { key: "demoDate", label: "DEMO DATE", type: "date" as const },
    { key: "demoTime", label: "DEMO TIME", type: "time" as const },
    { key: "postDate", label: "POST DATE", type: "date" as const },
    { key: "postTime", label: "POST TIME", type: "time" as const },
    { key: "views", label: "VIEWS", type: "number" as const },
    { key: "interactions", label: "INTERACTIONS", type: "number" as const },
    { key: "shares", label: "SHARES", type: "number" as const },
    { key: "saves", label: "SAVES", type: "number" as const },
  ] satisfies { key: keyof PlannerRow; label: string; type: "select" | "date" | "time" | "number" | "text" | "textarea" | "title"; options?: string[] }[];
}

function daysLeft(r: PlannerRow): string {
  if (!r.postDate) return "-";
  const d = new Date(r.postDate).getTime();
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((d - today.getTime()) / 86400000);
  return diff.toString();
}

export function PlanTable({ mode }: Props) {
  const [rows, setRows] = usePlannerRows();
  const { config } = usePlannerConfig();
  const COLS = useMemo(() => buildCols(config), [config]);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return rows
      .filter((r) => (mode === "archive" ? isPosted(r) : !isPosted(r)))
      .filter((r) =>
        search ? r.title.toLowerCase().includes(search.toLowerCase()) : true
      );
  }, [rows, mode, search]);

  const openRow = useMemo(() => rows.find((r) => r.id === openId) ?? null, [rows, openId]);

  const update = (id: string, key: keyof PlannerRow, value: unknown) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };
  const remove = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast.success("Row deleted");
  };
  const add = () => {
    setRows((prev) => [emptyRow(config), ...prev]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="ml-auto text-xs text-muted-foreground">
          ✍️ Total: <b className="text-foreground">{filtered.length}</b>
        </div>
        {mode === "active" && (
          <Button size="sm" onClick={add} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Add row
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/60 bg-card">
        <table className="w-full text-xs">
          <thead className="bg-surface text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              {COLS.map((c) => (
                <th key={c.key} className="whitespace-nowrap px-2 py-2 text-left font-semibold">
                  {c.label}
                </th>
              ))}
              <th className="px-2 py-2 text-left font-semibold">DAYS LEFT</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-border/40 hover:bg-accent/30">
                {COLS.map((c) => {
                  const v = row[c.key];
                  return (
                    <td key={c.key} className="px-1 py-1 align-top">
                      {c.type === "title" ? (
                        <button
                          type="button"
                          onClick={() => setOpenId(row.id)}
                          className="block min-w-48 max-w-xs truncate rounded border border-transparent bg-transparent px-2 py-1 text-left text-xs font-medium hover:border-border hover:bg-accent/50"
                          title="Click to open content"
                        >
                          {(v as string) || <span className="text-muted-foreground">(click to open)</span>}
                        </button>
                      ) : c.type === "select" ? (
                        <Select
                          value={(v as string) || ""}
                          onValueChange={(val) => update(row.id, c.key, val)}
                        >
                          <SelectTrigger className="h-8 min-w-32 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(c.options as string[]).map((o) => (
                              <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <input
                          type={c.type === "number" ? "number" : c.type === "date" ? "date" : c.type === "time" ? "time" : "text"}
                          value={(v as string | number | undefined) ?? ""}
                          onChange={(e) =>
                            update(
                              row.id,
                              c.key,
                              c.type === "number" ? (e.target.value === "" ? undefined : Number(e.target.value)) : e.target.value
                            )
                          }
                          className="w-full min-w-24 rounded border border-border/60 bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      )}
                    </td>
                  );
                })}
                <td className="px-2 py-1 text-center font-mono text-xs">
                  <span className={Number(daysLeft(row)) < 0 ? "text-destructive" : ""}>
                    {daysLeft(row)}
                  </span>
                </td>
                <td className="px-1 py-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(row.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLS.length + 2} className="px-4 py-8 text-center text-xs text-muted-foreground">
                  {mode === "archive" ? "No posted content yet." : "No rows. Click + Add row."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!openRow} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <Input
                value={openRow?.title ?? ""}
                onChange={(e) => openRow && update(openRow.id, "title", e.target.value)}
                placeholder="Title"
                className="border-0 px-0 font-display text-2xl font-semibold shadow-none focus-visible:ring-0"
              />
            </DialogTitle>
          </DialogHeader>

          {openRow && (
            <div className="space-y-4">
              {/* Calendar & classification — same look as Execute */}
              <div className="rounded-lg border border-border/60 bg-surface/40 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Schedule & Classification
                </p>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                  <Mini label="STATUS">
                    <Select value={openRow.status || ""} onValueChange={(v) => update(openRow.id, "status", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{config.statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Mini>
                  <Mini label="ASSIGNEE">
                    <Select value={openRow.assignee || ""} onValueChange={(v) => update(openRow.id, "assignee", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{config.assignees.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Mini>
                  <Mini label="CONTENT TYPE">
                    <Select value={openRow.contentType || ""} onValueChange={(v) => update(openRow.id, "contentType", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{config.contentTypes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Mini>
                  <Mini label="PLATFORM">
                    <Select value={openRow.platform || ""} onValueChange={(v) => update(openRow.id, "platform", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{config.platforms.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Mini>
                  <Mini label="FORMAT">
                    <Select value={openRow.format || ""} onValueChange={(v) => update(openRow.id, "format", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{config.formats.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Mini>
                  <Mini label="GOAL">
                    <Select value={openRow.goal || ""} onValueChange={(v) => update(openRow.id, "goal", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{config.goals.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Mini>
                  <Mini label="DEMO DATE">
                    <Input type="date" value={openRow.demoDate ?? ""} onChange={(e) => update(openRow.id, "demoDate", e.target.value)} className="h-8 text-xs" />
                  </Mini>
                  <Mini label="DEMO TIME">
                    <Input type="time" value={openRow.demoTime ?? ""} onChange={(e) => update(openRow.id, "demoTime", e.target.value)} className="h-8 text-xs" />
                  </Mini>
                  <Mini label="POST DATE">
                    <Input type="date" value={openRow.postDate ?? ""} onChange={(e) => update(openRow.id, "postDate", e.target.value)} className="h-8 text-xs" />
                  </Mini>
                  <Mini label="POST TIME">
                    <Input type="time" value={openRow.postTime ?? ""} onChange={(e) => update(openRow.id, "postTime", e.target.value)} className="h-8 text-xs" />
                  </Mini>
                </div>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Caption / Body</p>
                <Textarea
                  value={openRow.body ?? ""}
                  onChange={(e) => update(openRow.id, "body", e.target.value)}
                  rows={14}
                  className="resize-y font-sans text-sm leading-relaxed"
                  placeholder="Write the main content here…"
                />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Hashtags</p>
                <Input
                  value={openRow.hashtag ?? ""}
                  onChange={(e) => update(openRow.id, "hashtag", e.target.value)}
                  placeholder="#tag1 #tag2"
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
                <Textarea
                  value={openRow.note ?? ""}
                  onChange={(e) => update(openRow.id, "note", e.target.value)}
                  rows={3}
                  className="resize-y text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Mini({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
