import { usePlannerSample } from "@/lib/planner";

export function PlanSample() {
  const [text, setText] = usePlannerSample();
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Lưu các content sample, swipe file, ví dụ hay để học.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Topic: ...&#10;Hook: ...&#10;Body: ..."
        className="min-h-[480px] w-full rounded-lg border border-border/60 bg-card p-4 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}
