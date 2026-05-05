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
import { Plus, Lightbulb, TrendingUp, Search, Trash2, Sparkles } from "lucide-react";
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
  const [ideas, setIdeas] = useIdeas();
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

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

  return (
    <div>
      <PageHeader
        eyebrow="Content Brain"
        title="Idea database, không phải note."
        description="Mọi insight, trend, ý tưởng đều có chỗ. Tag rõ ngành & format để biến thành content có chủ đích."
      >
        <NewIdeaDialog
          onCreate={(idea) => {
            setIdeas((prev) => [idea, ...prev]);
            toast.success("Đã thêm vào Brain");
          }}
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
              <IdeaCard key={idea.id} idea={idea} onDelete={() => remove(idea.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IdeaCard({ idea, onDelete }: { idea: Idea; onDelete: () => void }) {
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
        <button
          onClick={onDelete}
          className="text-muted-foreground/50 opacity-0 transition hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <h3 className="mt-3 font-display text-lg font-medium leading-snug">{idea.title}</h3>
      {idea.note && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-4">
          {idea.note}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Badge variant="outline" className="text-[10px]">{idea.industry}</Badge>
        <Badge variant="outline" className="text-[10px]">{idea.format}</Badge>
      </div>
    </Card>
  );
}

function NewIdeaDialog({ onCreate }: { onCreate: (idea: Idea) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState<Idea["type"]>("idea");
  const [industry, setIndustry] = useState<Industry>("Lifestyle");
  const [format, setFormat] = useState<Format>("Reel");

  const submit = () => {
    if (!title.trim()) return;
    onCreate({
      id: uid(),
      title: title.trim(),
      note: note.trim(),
      type,
      industry,
      format,
      createdAt: Date.now(),
    });
    setTitle("");
    setNote("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Ý tưởng mới</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Thêm vào Brain</DialogTitle>
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
