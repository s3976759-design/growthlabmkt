import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANNER_CONFIG } from "@/lib/planner";

const sections: { title: string; items: readonly string[] }[] = [
  { title: "LOẠI NỘI DUNG", items: PLANNER_CONFIG.contentTypes },
  { title: "NỀN TẢNG", items: PLANNER_CONFIG.platforms },
  { title: "TRẠNG THÁI", items: PLANNER_CONFIG.statuses },
  { title: "ĐỊNH DẠNG", items: PLANNER_CONFIG.formats },
  { title: "MỤC TIÊU", items: PLANNER_CONFIG.goals },
  { title: "NGƯỜI THỰC HIỆN", items: PLANNER_CONFIG.assignees },
];

export function PlanSettings() {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tuần bắt đầu</p>
        <p className="mt-1 font-display text-lg">{PLANNER_CONFIG.weekStart}</p>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {sections.map((s) => (
          <Card key={s.title} className="p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.title}</p>
            <div className="flex flex-wrap gap-1.5">
              {s.items.map((it) => <Badge key={it} variant="outline" className="text-xs">{it}</Badge>)}
            </div>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Các tùy chọn này được dùng làm dropdown ở mọi bảng. Hiện đang đồng bộ từ file Excel gốc của bạn.
      </p>
    </div>
  );
}
