import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { usePlannerPillars, pid, type PlannerPillar } from "@/lib/planner";

export function PlanPillars() {
  const [items, setItems] = usePlannerPillars();
  const add = () => setItems((p) => [{ id: pid(), pillar: "", goal: "", examples: "" }, ...p]);
  const update = <K extends keyof PlannerPillar>(id: string, k: K, v: PlannerPillar[K]) =>
    setItems((p) => p.map((it) => (it.id === id ? { ...it, [k]: v } : it)));
  const remove = (id: string) => setItems((p) => p.filter((it) => it.id !== id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} pillars</p>
        <Button size="sm" onClick={add} className="gap-1"><Plus className="h-3.5 w-3.5" /> Thêm pillar</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border/60 bg-card">
        <table className="w-full text-xs">
          <thead className="bg-surface text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-2 py-2 text-left">Pillars</th>
              <th className="px-2 py-2 text-left">Mục tiêu</th>
              <th className="px-2 py-2 text-left">Ví dụ chủ đề</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-border/40">
                <td className="px-1 py-1"><Input value={i.pillar} onChange={(e) => update(i.id, "pillar", e.target.value)} className="h-8 text-xs" /></td>
                <td className="px-1 py-1"><Input value={i.goal} onChange={(e) => update(i.id, "goal", e.target.value)} className="h-8 text-xs" /></td>
                <td className="px-1 py-1"><Input value={i.examples} onChange={(e) => update(i.id, "examples", e.target.value)} className="h-8 text-xs" /></td>
                <td className="px-1 py-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(i.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Chưa có pillar.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
