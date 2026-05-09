import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useContents, useIdeas, type ContentItem, type Idea } from "@/lib/storage";
import { usePlannerConfig, upsertPlannerRow } from "@/lib/planner";
import { Pencil, Plus, Search, X, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline — Growth Lab" },
      { name: "description", content: "Mọi nội dung đã lưu, gom theo trạng thái." },
    ],
  }),
  component: PipelinePage,
});

type Card = {
  id: string;
  kind: "content" | "idea";
  title: string;
  status: string;
  platform?: string;
  format?: string;
  goal?: string;
  hashtags?: string;
  caption?: string;
  createdAt: number;
  postDate?: string;
  raw: ContentItem | Idea;
};

const ALL = "__all__";

function PipelinePage() {
  const [contents, setContents] = useContents();
  const [ideas] = useIdeas();
  const { config } = usePlannerConfig();

  const [query, setQuery] = useState("");
  const [fPlatform, setFPlatform] = useState(ALL);
  const [fFormat, setFFormat] = useState(ALL);
  const [fGoal, setFGoal] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const ideaStatus = config.statuses[0] ?? "💡 Lên ý tưởng";

  const cards: Card[] = useMemo(() => {
    const fromContents: Card[] = contents.map((c) => ({
      id: c.id,
      kind: "content",
      title: c.title || "(không tiêu đề)",
      status: c.status || ideaStatus,
      platform: c.platform,
      format: c.format,
      goal: c.goal,
      hashtags: c.hashtags,
      caption: c.caption,
      createdAt: c.createdAt,
      postDate: c.postDate,
      raw: c,
    }));
    const fromIdeas: Card[] = ideas.map((i) => ({
      id: `idea-${i.id}`,
      kind: "idea",
      title: i.title,
      status: ideaStatus,
      format: i.format,
      caption: i.note,
      createdAt: i.createdAt,
      raw: i,
    }));
    return [...fromContents, ...fromIdeas];
  }, [contents, ideas, ideaStatus]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromTs = from ? new Date(from).getTime() : null;
    const toTs = to ? new Date(to).getTime() + 86400000 : null;
    return cards.filter((c) => {
      if (q && !`${c.title} ${c.caption ?? ""} ${c.hashtags ?? ""}`.toLowerCase().includes(q)) return false;
      if (fPlatform !== ALL && c.platform !== fPlatform) return false;
      if (fFormat !== ALL && c.format !== fFormat) return false;
      if (fGoal !== ALL && c.goal !== fGoal) return false;
      const refTs = c.postDate ? new Date(c.postDate).getTime() : c.createdAt;
      if (fromTs && refTs < fromTs) return false;
      if (toTs && refTs >= toTs) return false;
      return true;
    });
  }, [cards, query, fPlatform, fFormat, fGoal, from, to]);

  const grouped = useMemo(() => {
    const map: Record<string, Card[]> = {};
    for (const s of config.statuses) map[s] = [];
    for (const c of filtered) {
      const key = config.statuses.includes(c.status) ? c.status : config.statuses[0];
      (map[key] ??= []).push(c);
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => b.createdAt - a.createdAt);
    return map;
  }, [filtered, config.statuses]);

  const moveCard = (cardId: string, newStatus: string) => {
    if (!cardId.startsWith("idea-")) {
      setContents((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, status: newStatus } : c))
      );
      const item = contents.find((c) => c.id === cardId);
      if (item) {
        upsertPlannerRow({
          id: cardId,
          status: newStatus,
          title: item.title,
          platform: item.platform,
          format: item.format,
          goal: item.goal,
          contentType: item.contentType ?? "",
        });
      }
    }
  };

  const clearFilters = () => {
    setQuery(""); setFPlatform(ALL); setFFormat(ALL); setFGoal(ALL); setFrom(""); setTo("");
  };

  const hasFilter = query || fPlatform !== ALL || fFormat !== ALL || fGoal !== ALL || from || to;

  return (
    <div>
      <PageHeader
        eyebrow="Pipeline"
        title="Mọi nội dung của bé, gom theo trạng thái."
        description="Kéo thẻ giữa các cột để đổi trạng thái. Bài lưu trong Execute và ý tưởng trong Brain đều xuất hiện ở đây."
      >
        <Button asChild className="gap-2">
          <Link to="/execute" search={{}}>
            <Plus className="h-4 w-4" /> Viết bài mới
          </Link>
        </Button>
      </PageHeader>

      <div className="space-y-4 px-6 py-6 md:px-10">
        <Card className="border-border/60 bg-card p-3 shadow-soft">
          <div className="grid gap-2 md:grid-cols-6">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm tiêu đề, caption, hashtag…"
                className="h-9 pl-8 text-xs"
              />
            </div>
            <Select value={fPlatform} onValueChange={setFPlatform}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Kênh" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả kênh</SelectItem>
                {config.platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fFormat} onValueChange={setFFormat}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Định dạng" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả định dạng</SelectItem>
                {config.formats.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fGoal} onValueChange={setFGoal}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Mục tiêu" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả mục tiêu</SelectItem>
                {config.goals.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 text-xs" title="Từ ngày" />
              <span className="text-xs text-muted-foreground">→</span>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 text-xs" title="Đến ngày" />
            </div>
          </div>
          {hasFilter && (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>{filtered.length} thẻ phù hợp</span>
              <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-[11px]" onClick={clearFilters}>
                <X className="h-3 w-3" /> Xoá lọc
              </Button>
            </div>
          )}
        </Card>

        <div className="flex gap-3 overflow-x-auto pb-3">
          {config.statuses.map((status) => (
            <StatusColumn
              key={status}
              status={status}
              items={grouped[status] ?? []}
              onDrop={(id) => moveCard(id, status)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusColumn({
  status,
  items,
  onDrop,
}: {
  status: string;
  items: Card[];
  onDrop: (cardId: string) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      className={`flex w-72 shrink-0 flex-col rounded-lg border ${
        over ? "border-primary bg-primary/5" : "border-border/60 bg-surface/30"
      } p-2 transition`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDrop(id);
      }}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <Badge variant="outline" className="border-border/60 text-[11px]">{status}</Badge>
        <span className="text-[10px] text-muted-foreground">{items.length}</span>
      </div>

      <div className="flex-1 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-[11px] text-muted-foreground">
            Kéo thẻ vào đây
          </div>
        ) : (
          items.map((c) => <PipelineCard key={c.id} c={c} />)
        )}
      </div>
    </div>
  );
}

function PipelineCard({ c }: { c: Card }) {
  const isIdea = c.kind === "idea";
  const realId = isIdea ? c.id.replace(/^idea-/, "") : c.id;
  return (
    <Card
      draggable={!isIdea}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", c.id);
      }}
      className={`group border-border/60 bg-card p-3 shadow-soft ${
        isIdea ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 font-display text-xs font-semibold leading-snug">
          {isIdea && <Lightbulb className="mr-1 inline h-3 w-3 text-insight" />}
          {c.title}
        </h3>
        {!isIdea && (
          <Button asChild size="icon" variant="ghost" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100">
            <Link to="/execute" search={{ id: realId }} aria-label="Edit">
              <Pencil className="h-3 w-3" />
            </Link>
          </Button>
        )}
        {isIdea && (
          <Button asChild size="icon" variant="ghost" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100">
            <Link to="/execute" search={{}} aria-label="Viết">
              <Plus className="h-3 w-3" />
            </Link>
          </Button>
        )}
      </div>

      {c.caption && (
        <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
          {c.caption}
        </p>
      )}

      <div className="mt-2 flex flex-wrap gap-1">
        {c.platform && <Badge variant="secondary" className="text-[9px]">{c.platform}</Badge>}
        {c.format && <Badge variant="secondary" className="text-[9px]">{c.format}</Badge>}
        {c.goal && <Badge variant="secondary" className="text-[9px]">{c.goal}</Badge>}
      </div>

      {c.hashtags && (
        <p className="mt-1.5 line-clamp-1 font-mono text-[9px] text-primary">{c.hashtags}</p>
      )}

      <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-1.5 text-[9px] text-muted-foreground">
        <span>{c.postDate || new Date(c.createdAt).toLocaleDateString("vi-VN")}</span>
        {isIdea && <span className="text-insight">Brain</span>}
      </div>
    </Card>
  );
}
