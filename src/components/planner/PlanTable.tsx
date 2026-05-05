import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import {
  usePlannerRows,
  PLANNER_CONFIG,
  emptyRow,
  isPosted,
  type PlannerRow,
} from "@/lib/planner";
import { toast } from "sonner";

interface Props {
  /** "active" = chưa đăng, "archive" = đã đăng */
  mode: "active" | "archive";
}

const COLS: { key: keyof PlannerRow; label: string; type?: "select" | "date" | "time" | "number" | "text" | "textarea"; options?: readonly string[] | string[] }[] = [
  { key: "title", label: "TIÊU ĐỀ / NỘI DUNG CHÍNH", type: "text" },
  { key: "assignee", label: "NGƯỜI THỰC HIỆN", type: "select", options: PLANNER_CONFIG.assignees as unknown as string[] },
  { key: "status", label: "TRẠNG THÁI", type: "select", options: PLANNER_CONFIG.statuses as unknown as string[] },
  { key: "contentType", label: "LOẠI NỘI DUNG", type: "select", options: PLANNER_CONFIG.contentTypes as unknown as string[] },
  { key: "platform", label: "NỀN TẢNG", type: "select", options: PLANNER_CONFIG.platforms as unknown as string[] },
  { key: "format", label: "ĐỊNH DẠNG", type: "select", options: PLANNER_CONFIG.formats as unknown as string[] },
  { key: "goal", label: "MỤC TIÊU", type: "select", options: PLANNER_CONFIG.goals as unknown as string[] },
  { key: "demoDate", label: "NGÀY CÓ DEMO", type: "date" },
  { key: "demoTime", label: "GIỜ CÓ DEMO", type: "time" },
  { key: "postDate", label: "NGÀY ĐĂNG", type: "date" },
  { key: "postTime", label: "GIỜ ĐĂNG", type: "time" },
  { key: "body", label: "NỘI DUNG", type: "textarea" },
  { key: "hashtag", label: "HASHTAG", type: "text" },
  { key: "assetLink", label: "ASSET LINK", type: "text" },
  { key: "note", label: "GHI CHÚ", type: "textarea" },
  { key: "views", label: "SỐ LƯỢT XEM", type: "number" },
  { key: "interactions", label: "SỐ LƯỢT TƯƠNG TÁC", type: "number" },
  { key: "shares", label: "SỐ LƯỢT CHIA SẺ", type: "number" },
  { key: "saves", label: "SỐ LƯỢT LƯU LẠI", type: "number" },
  { key: "recordedAt", label: "NGÀY GHI LẠI", type: "date" },
];

function daysLeft(r: PlannerRow): string {
  if (!r.postDate) return "-";
  const d = new Date(r.postDate).getTime();
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((d - today.getTime()) / 86400000);
  return diff.toString();
}

export function PlanTable({ mode }: Props) {
  const [rows, setRows] = usePlannerRows();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return rows
      .filter((r) => (mode === "archive" ? isPosted(r) : !isPosted(r)))
      .filter((r) =>
        search ? r.title.toLowerCase().includes(search.toLowerCase()) : true
      );
  }, [rows, mode, search]);

  const update = (id: string, key: keyof PlannerRow, value: unknown) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };
  const remove = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast.success("Đã xoá dòng");
  };
  const add = () => {
    setRows((prev) => [emptyRow(), ...prev]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Tìm theo tiêu đề..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="ml-auto text-xs text-muted-foreground">
          ✍️ Tổng: <b className="text-foreground">{filtered.length}</b>
        </div>
        {mode === "active" && (
          <Button size="sm" onClick={add} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Thêm dòng
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
              <th className="px-2 py-2 text-left font-semibold">CÒN LẠI</th>
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
                      {c.type === "select" ? (
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
                      ) : c.type === "textarea" ? (
                        <textarea
                          value={(v as string) || ""}
                          onChange={(e) => update(row.id, c.key, e.target.value)}
                          rows={1}
                          className="min-w-48 resize-y rounded border border-border/60 bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        />
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
                  {mode === "archive" ? "Chưa có bài nào đã đăng." : "Chưa có dòng. Bấm + Thêm dòng."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
