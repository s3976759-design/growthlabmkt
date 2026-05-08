import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useContents, type ContentItem } from "@/lib/storage";
import { useT } from "@/lib/i18n";
import { Pencil, Plus } from "lucide-react";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline — Growth Lab" },
      { name: "description", content: "Mọi nội dung đã lưu, gom theo trạng thái." },
    ],
  }),
  component: PipelinePage,
});

const COLUMNS: { key: string; label: string; tone: string }[] = [
  { key: "idea", label: "Ý tưởng", tone: "bg-insight/10 text-insight border-insight/30" },
  { key: "draft", label: "Nháp", tone: "bg-muted text-foreground border-border" },
  { key: "scheduled", label: "Đã lên lịch", tone: "bg-primary/10 text-primary border-primary/30" },
  { key: "posted", label: "Đã đăng", tone: "bg-growth/10 text-growth border-growth/30" },
];

function PipelinePage() {
  const t = useT();
  const [contents] = useContents();

  const grouped = useMemo(() => {
    const map: Record<string, ContentItem[]> = { idea: [], draft: [], scheduled: [], posted: [] };
    for (const c of contents) {
      const k = COLUMNS.some((col) => col.key === c.status) ? c.status : "draft";
      (map[k] ??= []).push(c);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => b.createdAt - a.createdAt);
    }
    return map;
  }, [contents]);

  return (
    <div>
      <PageHeader
        eyebrow="Pipeline"
        title="Mọi nội dung của bé, gom theo trạng thái."
        description="Xem nhanh từ ý tưởng đến đã đăng. Bấm Edit để mở lại trong Execute."
      >
        <Button asChild className="gap-2">
          <Link to="/execute" search={{}}>
            <Plus className="h-4 w-4" /> Viết bài mới
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 px-6 py-8 md:px-10 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = grouped[col.key] ?? [];
          return (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`border ${col.tone}`}>
                  {col.label}
                </Badge>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>

              <div className="space-y-2">
                {items.length === 0 ? (
                  <Card className="border-dashed border-border/60 bg-transparent p-6 text-center text-xs text-muted-foreground">
                    Trống
                  </Card>
                ) : (
                  items.map((c) => (
                    <Card key={c.id} className="border-border/60 bg-card p-4 shadow-soft">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug">
                          {c.title || "(không tiêu đề)"}
                        </h3>
                        <Button asChild size="icon" variant="ghost" className="h-7 w-7 shrink-0">
                          <Link to="/execute" search={{ id: c.id }} aria-label="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>

                      {c.caption && (
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {c.caption}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-1">
                        {c.platform && <Badge variant="secondary" className="text-[10px]">{c.platform}</Badge>}
                        {c.format && <Badge variant="secondary" className="text-[10px]">{c.format}</Badge>}
                        {c.goal && <Badge variant="secondary" className="text-[10px]">{c.goal}</Badge>}
                      </div>

                      {c.hashtags && (
                        <p className="mt-2 line-clamp-1 font-mono text-[10px] text-primary">
                          {c.hashtags}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
                        <span>{new Date(c.createdAt).toLocaleDateString("vi-VN")}</span>
                        <Button asChild size="sm" variant="ghost" className="h-6 px-2 text-[10px]">
                          <Link to="/execute" search={{ id: c.id }}>Edit</Link>
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
