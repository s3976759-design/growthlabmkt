import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, RotateCcw, Pencil, Check, X } from "lucide-react";
import { usePlannerConfig, type ConfigListKey } from "@/lib/planner";
import { toast } from "sonner";

const SECTIONS: { key: ConfigListKey; title: string }[] = [
  { key: "contentTypes", title: "CONTENT TYPE" },
  { key: "platforms", title: "PLATFORM" },
  { key: "statuses", title: "STATUS" },
  { key: "formats", title: "FORMAT" },
  { key: "goals", title: "GOAL" },
  { key: "assignees", title: "ASSIGNEE" },
];

export function PlanSettings() {
  const { config, addOption, updateOption, removeOption, setWeekStart, reset } = usePlannerConfig();

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-3 p-4">
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Week starts on</p>
          <Input
            value={config.weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="mt-1 h-9 max-w-xs text-sm"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => {
            if (confirm("Restore default settings? All customizations will be lost.")) {
              reset();
              toast.success("Settings reset");
            }
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <ListEditor
            key={s.key}
            title={s.title}
            items={config[s.key] as string[]}
            onAdd={(v) => addOption(s.key, v)}
            onUpdate={(idx, v) => updateOption(s.key, idx, v)}
            onRemove={(idx) => removeOption(s.key, idx)}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        These options power dropdowns across every table. Changes apply instantly.
      </p>
    </div>
  );
}

function ListEditor({
  title,
  items,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  items: string[];
  onAdd: (v: string) => void;
  onUpdate: (idx: number, v: string) => void;
  onRemove: (idx: number) => void;
}) {
  const [draft, setDraft] = useState("");
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");

  const submit = () => {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  };

  const startEdit = (idx: number) => {
    setEditIdx(idx);
    setEditVal(items[idx]);
  };
  const commitEdit = () => {
    if (editIdx === null) return;
    onUpdate(editIdx, editVal);
    setEditIdx(null);
  };

  return (
    <Card className="p-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <ul className="space-y-1.5">
        {items.map((it, idx) => (
          <li key={`${it}-${idx}`} className="group flex items-center gap-2 rounded-md border border-border/40 bg-surface/40 px-2 py-1">
            {editIdx === idx ? (
              <>
                <Input
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && commitEdit()}
                  className="h-7 flex-1 text-xs"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={commitEdit}>
                  <Check className="h-3.5 w-3.5 text-growth" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditIdx(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-xs">{it}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => startEdit(idx)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => onRemove(idx)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="px-2 py-1 text-xs text-muted-foreground">No items yet.</li>}
      </ul>
      <div className="mt-2 flex gap-1">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Add new..."
          className="h-8 flex-1 text-xs"
        />
        <Button size="icon" className="h-8 w-8" onClick={submit}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
