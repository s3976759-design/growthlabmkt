import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Lightbulb, TrendingUp, Search, Trash2, Sparkles, Pencil } from "lucide-react";
import { useIdeas, uid, type Idea, type Industry, type Format } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/brain")({
  head: () => ({
    meta: [
      { title: "Brain — Growth Lab" },
      { name: "description", content: "Idea database. Lưu insight khách hàng, ý tưởng, trend." },
    ],
  }),
  component: BrainPage,
});

const industries: Industry[] = ["Food", "Healthcare", "Beauty", "Tech", "Education", "Lifestyle", "Finance", "Other"];
const formats: Format[] = ["Reel", "Post", "Story", "Carousel", "Video", "Article", "Live"];

function BrainPage() {
  const t = useT();
  const [ideas, setIdeas] = useIdeas();
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [editing, setEditing] = useState<Idea | null>(null);

  const filtered = ideas
    .filter((i) => filterType === "all" || i.type === filterType)
    .filter(
      (i) =>
        !query ||
        i.title.toLowerCase().includes(query.toLowerCase()) ||
        i.note.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => b.createdAt - a.createdAt);

  const remove = (id: string) => {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    toast.success("Đã xoá ý tưởng");
  };
  const upsert = (idea: Idea) => {
    setIdeas((prev) => {
      const exists = prev.some((p) => p.id === idea.id);
      return exists ? prev.map((p) => (p.id === idea.id ? idea : p)) : [idea, ...prev];
    });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Content Brain"
        title="Idea database, không phải note."
        description="Mọi insight, trend, ý tưởng đều có chỗ. Tag rõ ngành & format để biến thành content có chủ đích."
      >
        <IdeaDialog
          trigger={<Button className="gap-2"><Plus className="h-4 w-4" /> Ý tưởng mới</Button>}
          onSave={(i) => { upsert(i); toast.success("Đã thêm vào Brain"); }}
        />
      </PageHeader>

      <div className="px-6 py-8 md:px-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm ý tưởng, insight…"
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="md:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="idea">💡 Ý tưởng</SelectItem>
              <SelectItem value="insight">🔍 Insight</SelectItem>
              <SelectItem value="trend">🔥 Trend</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <Card className="mt-8 border-dashed bg-surface/50 p-12 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-4 font-display text-xl">Brain còn trống.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Một ý tưởng dở vẫn hơn một trí nhớ tốt. Lưu ngay đi.
            </p>
          </Card>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onDelete={() => remove(idea.id)}
                onEdit={() => setEditing(idea)}
              />
            ))}
          </div>
        )}
      </div>

      {editing && (
        <IdeaDialog
          initial={editing}
          open
          onOpenChange={(o) => !o && setEditing(null)}
          onSave={(i) => { upsert(i); setEditing(null); toast.success("Đã cập nhật"); }}
        />
      )}
    </div>
  );
}

function IdeaCard({ idea, onDelete, onEdit }: { idea: Idea; onDelete: () => void; onEdit: () => void }) {
  const typeMeta = {
    idea: { icon: Lightbulb, label: "Ý tưởng", color: "bg-growth/15 text-foreground" },
    insight: { icon: Search, label: "Insight", color: "bg-insight/15 text-insight" },
    trend: { icon: TrendingUp, label: "Trend", color: "bg-accent text-accent-foreground" },
  }[idea.type];

  return (
    <Card className="group relative overflow-hidden border-border/60 bg-card p-5 shadow-soft transition hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <Badge variant="secondary" className={`gap-1 ${typeMeta.color}`}>
          <typeMeta.icon className="h-3 w-3" />
          {typeMeta.label}
        </Badge>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button onClick={onEdit} className="text-muted-foreground/60 transition hover:text-foreground">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="text-muted-foreground/60 transition hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <button onClick={onEdit} className="mt-3 block w-full text-left">
        <h3 className="font-display text-lg font-medium leading-snug">{idea.title}</h3>
        {idea.note && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-4">
            {idea.note}
          </p>
        )}
      </button>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Badge variant="outline" className="text-[10px]">{idea.industry}</Badge>
        <Badge variant="outline" className="text-[10px]">{idea.format}</Badge>
      </div>
    </Card>
  );
}

interface DialogProps {
  trigger?: React.ReactNode;
  initial?: Idea;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  onSave: (idea: Idea) => void;
}

function IdeaDialog({ trigger, initial, open, onOpenChange, onSave }: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open! : internalOpen;
  const setOpen = (o: boolean) => { isControlled ? onOpenChange?.(o) : setInternalOpen(o); };

  const [title, setTitle] = useState(initial?.title ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [type, setType] = useState<Idea["type"]>(initial?.type ?? "idea");
  const [industry, setIndustry] = useState<Industry>(initial?.industry ?? "Lifestyle");
  const [format, setFormat] = useState<Format>(initial?.format ?? "Reel");

  const submit = () => {
    if (!title.trim()) return;
    onSave({
      id: initial?.id ?? uid(),
      title: title.trim(),
      note: note.trim(),
      type,
      industry,
      format,
      createdAt: initial?.createdAt ?? Date.now(),
    });
    if (!initial) {
      setTitle(""); setNote("");
    }
    setOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {initial ? "Chỉnh sửa ý tưởng" : "Thêm vào Brain"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input placeholder="Tiêu đề / câu hook…" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea
            rows={4}
            placeholder="Insight, ngữ cảnh, nguồn cảm hứng…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="grid grid-cols-3 gap-2">
            <Select value={type} onValueChange={(v) => setType(v as Idea["type"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="idea">💡 Ý tưởng</SelectItem>
                <SelectItem value="insight">🔍 Insight</SelectItem>
                <SelectItem value="trend">🔥 Trend</SelectItem>
              </SelectContent>
            </Select>
            <Select value={industry} onValueChange={(v) => setIndustry(v as Industry)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={format} onValueChange={(v) => setFormat(v as Format)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {formats.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Huỷ</Button>
          <Button onClick={submit}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
