import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { z } from "zod";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useContents, useIdeas, uid,
  type ContentItem, type Platform, type Format, type Goal, type Status,
} from "@/lib/storage";
import { Save, Sparkles, History, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

const search = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/execute")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Execute — Growth Lab" },
      { name: "description", content: "Viết caption, lưu version, gắn mục tiêu." },
    ],
  }),
  component: ExecutePage,
});

const platforms: Platform[] = ["Facebook", "Instagram", "TikTok", "LinkedIn", "Threads", "YouTube"];
const formats: Format[] = ["Reel", "Post", "Story", "Carousel", "Video", "Article", "Live"];
const goals: Goal[] = ["Reach", "Engagement", "Conversion", "Awareness", "Retention"];
const statuses: Status[] = ["idea", "draft", "scheduled", "posted"];

const HOOKS = [
  "Bạn có biết… [statistic shock]?",
  "3 sai lầm khiến bạn… ",
  "Tôi đã thử [X] trong 7 ngày, đây là kết quả",
  "Đừng làm [X] nếu bạn chưa biết điều này",
  "Bí mật mà ngành [X] không muốn bạn biết",
];
const CTAS = [
  "Lưu lại để dùng sau 👇",
  "Bạn nghĩ sao? Comment cho mình biết nhé.",
  "Share cho người cần đọc.",
  "Follow để xem phần 2.",
  "DM 'Yes' để mình gửi template.",
];

function ExecutePage() {
  const navigate = useNavigate();
  const { id } = Route.useSearch();
  const [contents, setContents] = useContents();
  const [ideas] = useIdeas();

  const editing = useMemo(() => contents.find((c) => c.id === id), [contents, id]);
  const isNew = !editing;

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [format, setFormat] = useState<Format>("Reel");
  const [goal, setGoal] = useState<Goal>("Engagement");
  const [status, setStatus] = useState<Status>("draft");
  const [ideaId, setIdeaId] = useState<string>("none");

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setCaption(editing.caption);
      setPlatform(editing.platform);
      setFormat(editing.format);
      setGoal(editing.goal);
      setStatus(editing.status);
      setIdeaId(editing.ideaId ?? "none");
    } else {
      setTitle(""); setCaption(""); setStatus("draft");
    }
  }, [editing]);

  const save = () => {
    if (!title.trim()) {
      toast.error("Cần một tiêu đề");
      return;
    }
    if (editing) {
      setContents((prev) =>
        prev.map((c) => {
          if (c.id !== editing.id) return c;
          const captionChanged = c.caption !== caption;
          return {
            ...c,
            title, caption, platform, format, goal, status,
            ideaId: ideaId === "none" ? undefined : ideaId,
            postedAt: status === "posted" ? c.postedAt ?? Date.now() : c.postedAt,
            versions:
              captionChanged && c.caption
                ? [{ id: uid(), caption: c.caption, createdAt: Date.now() }, ...c.versions]
                : c.versions,
          };
        })
      );
      toast.success("Đã cập nhật");
    } else {
      const item: ContentItem = {
        id: uid(),
        title, caption, versions: [],
        status, platform, format, goal,
        ideaId: ideaId === "none" ? undefined : ideaId,
        postedAt: status === "posted" ? Date.now() : undefined,
        createdAt: Date.now(),
      };
      setContents((prev) => [item, ...prev]);
      toast.success("Đã lưu vào pipeline");
      navigate({ to: "/execute", search: { id: item.id } });
    }
  };

  const remove = () => {
    if (!editing) return;
    setContents((prev) => prev.filter((c) => c.id !== editing.id));
    toast.success("Đã xoá");
    navigate({ to: "/execute", search: {} });
  };

  const insertHook = () => {
    const h = HOOKS[Math.floor(Math.random() * HOOKS.length)];
    setCaption((prev) => `${h}\n\n${prev}`);
  };
  const insertCta = () => {
    const c = CTAS[Math.floor(Math.random() * CTAS.length)];
    setCaption((prev) => `${prev}\n\n${c}`);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Content Execution"
        title={editing ? "Tinh chỉnh bài viết." : "Viết bài mới."}
        description="Caption, mục tiêu, version. Sạch sẽ. Không phân tâm."
      >
        {editing && (
          <Button variant="ghost" size="sm" onClick={remove} className="gap-2 text-destructive">
            <Trash2 className="h-4 w-4" /> Xoá
          </Button>
        )}
        <Button onClick={save} className="gap-2"><Save className="h-4 w-4" /> Lưu</Button>
      </PageHeader>

      <div className="grid gap-6 px-6 py-8 md:px-10 lg:grid-cols-3">
        <Card className="border-border/60 bg-card p-6 shadow-soft lg:col-span-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề bài (chỉ bạn thấy)…"
            className="border-0 bg-transparent px-0 font-display text-2xl font-medium shadow-none focus-visible:ring-0 md:text-3xl"
          />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={insertHook}>
              <Sparkles className="h-3.5 w-3.5 text-insight" /> Hook gợi ý
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={insertCta}>
              <Sparkles className="h-3.5 w-3.5 text-growth" /> CTA gợi ý
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">{caption.length} ký tự</span>
          </div>
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Viết caption ở đây…"
            rows={16}
            className="mt-3 resize-none border-border/60 bg-surface font-sans text-base leading-relaxed"
          />

          {editing && editing.versions.length > 0 && (
            <div className="mt-6 border-t border-border/60 pt-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <History className="h-4 w-4" />
                <span className="font-medium">Phiên bản trước ({editing.versions.length})</span>
              </div>
              <div className="mt-3 space-y-2">
                {editing.versions.slice(0, 3).map((v) => (
                  <div key={v.id} className="rounded-md border border-border/60 bg-surface/60 p-3">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{new Date(v.createdAt).toLocaleString("vi-VN")}</span>
                      <button
                        className="hover:text-foreground"
                        onClick={() => setCaption(v.caption)}
                      >
                        Khôi phục
                      </button>
                    </div>
                    <p className="mt-1 line-clamp-3 text-xs leading-relaxed">{v.caption}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="border-border/60 bg-card p-5 shadow-soft">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Setup
            </p>
            <div className="mt-4 space-y-3">
              <Field label="Channel">
                <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Format">
                <Select value={format} onValueChange={(v) => setFormat(v as Format)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{formats.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Mục tiêu">
                <Select value={goal} onValueChange={(v) => setGoal(v as Goal)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{goals.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Trạng thái">
                <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Từ ý tưởng">
                <Select value={ideaId} onValueChange={setIdeaId}>
                  <SelectTrigger><SelectValue placeholder="Không gắn" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Không gắn —</SelectItem>
                    {ideas.map((i) => <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Card>

          {!isNew && (
            <Card className="border-border/60 bg-surface/60 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Thuộc tính
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" /> {editing!.versions.length} versions</Badge>
                <Badge variant="outline">Tạo {new Date(editing!.createdAt).toLocaleDateString("vi-VN")}</Badge>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
