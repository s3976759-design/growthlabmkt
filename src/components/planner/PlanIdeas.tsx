import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { usePlannerIdeas, PLANNER_CONFIG, pid, type PlannerIdea } from "@/lib/planner";

export function PlanIdeas() {
  const [ideas, setIdeas] = usePlannerIdeas();

  const add = () => {
    const n: PlannerIdea = {
      id: pid(),
      idea: "",
      contentType: PLANNER_CONFIG.contentTypes[0],
      platform: PLANNER_CONFIG.platforms[0],
      format: PLANNER_CONFIG.formats[0],
      goal: PLANNER_CONFIG.goals[0],
      used: false,
      createdAt: Date.now(),
    };
    setIdeas((p) => [n, ...p]);
  };
  const update = <K extends keyof PlannerIdea>(id: string, key: K, value: PlannerIdea[K]) =>
    setIdeas((p) => p.map((i) => (i.id === id ? { ...i, [key]: value } : i)));
  const remove = (id: string) => setIdeas((p) => p.filter((i) => i.id !== id));

  const cols: readonly { label: string; key: keyof PlannerIdea; opts?: readonly string[] | string[] }[] = [
    { label: "LOẠI NỘI DUNG", key: "contentType", opts: PLANNER_CONFIG.contentTypes as unknown as string[] },
    { label: "NỀN TẢNG", key: "platform", opts: PLANNER_CONFIG.platforms as unknown as string[] },
    { label: "ĐỊNH DẠNG", key: "format", opts: PLANNER_CONFIG.formats as unknown as string[] },
    { label: "MỤC TIÊU", key: "goal", opts: PLANNER_CONFIG.goals as unknown as string[] },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{ideas.length} ý tưởng · {ideas.filter(i => !i.used).length} chưa dùng</p>
        <Button size="sm" onClick={add} className="gap-1"><Plus className="h-3.5 w-3.5" /> Thêm ý tưởng</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border/60 bg-card">
        <table className="w-full text-xs">
          <thead className="bg-surface text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-2 py-2 text-left">Ý TƯỞNG</th>
              {cols.map((c) => <th key={c.label} className="px-2 py-2 text-left">{c.label}</th>)}
              <th className="px-2 py-2 text-left">LẤY CẢM HỨNG TỪ</th>
              <th className="px-2 py-2 text-left">GHI CHÚ</th>
              <th className="px-2 py-2 text-center">ĐÃ DÙNG</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ideas.map((i) => (
              <tr key={i.id} className="border-t border-border/40">
                <td className="px-1 py-1">
                  <Input value={i.idea} onChange={(e) => update(i.id, "idea", e.target.value)} className="h-8 min-w-64 text-xs" />
                </td>
                {cols.map((c) => (
                  <td key={c.label} className="px-1 py-1">
                    <Select value={i[c.key] as string} onValueChange={(v) => update(i.id, c.key, v as PlannerIdea[typeof c.key])}>
                      <SelectTrigger className="h-8 min-w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(c.opts as string[]).map((o) => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                ))}
                <td className="px-1 py-1">
                  <Input value={i.inspiration ?? ""} onChange={(e) => update(i.id, "inspiration", e.target.value)} className="h-8 min-w-32 text-xs" />
                </td>
                <td className="px-1 py-1">
                  <Input value={i.note ?? ""} onChange={(e) => update(i.id, "note", e.target.value)} className="h-8 min-w-32 text-xs" />
                </td>
                <td className="px-2 py-1 text-center">
                  <Checkbox checked={i.used} onCheckedChange={(v) => update(i.id, "used", !!v)} />
                </td>
                <td className="px-1 py-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(i.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {ideas.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Chưa có ý tưởng.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
