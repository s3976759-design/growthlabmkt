import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/PageHeader";
import { useT } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Wand2,
  Copy,
  RefreshCw,
  Scissors,
  Flame,
  Coffee,
  Save,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { generateDraft, type DraftInput, type DraftOutput } from "@/server/ai-writer.functions";
import { usePlannerRows, usePlannerConfig, pid, type PlannerRow } from "@/lib/planner";

export const Route = createFileRoute("/ai-writer")({
  head: () => ({
    meta: [
      { title: "AI Draft Writer — Growth Lab" },
      { name: "description", content: "Biến ý tưởng thành caption, script, carousel outline trong vài giây." },
    ],
  }),
  component: AIWriterPage,
});

const PLATFORMS: DraftInput["platform"][] = ["Facebook", "Instagram", "TikTok", "LinkedIn"];
const FORMATS: DraftInput["format"][] = ["Caption", "Reel/TikTok script", "Carousel outline"];
const TONES: DraftInput["tone"][] = ["Professional", "Friendly", "Educational", "Soft-selling", "Bold"];
const GOALS: DraftInput["goal"][] = ["Awareness", "Engagement", "Education", "Conversion"];

type FormState = Omit<DraftInput, "refine" | "previousDraft">;

const INITIAL: FormState = {
  idea: "",
  brand: "",
  audience: "",
  platform: "Instagram",
  format: "Caption",
  tone: "Friendly",
  goal: "Engagement",
  keyMessage: "",
  cta: "",
  notes: "",
  industry: "",
};

function AIWriterPage() {
  const t = useT();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [output, setOutput] = useState<DraftOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState<DraftInput["refine"] | null>(null);
  const generate = useServerFn(generateDraft);
  const [, setRows] = usePlannerRows();
  const { config } = usePlannerConfig();

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const run = async (refine?: DraftInput["refine"]) => {
    if (!form.idea.trim()) {
      toast.error("Vui lòng nhập ý tưởng nội dung.");
      return;
    }
    refine ? setRefining(refine) : setLoading(true);
    try {
      const data = await generate({
        data: {
          ...form,
          refine,
          previousDraft: refine ? output?.draft : undefined,
        },
      });
      setOutput(data);
      toast.success(refine ? "Đã chỉnh lại bản nháp" : "Đã có bản nháp mới");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Có lỗi khi gọi AI");
    } finally {
      setLoading(false);
      setRefining(null);
    }
  };

  const copyAll = () => {
    if (!output) return;
    const txt = [
      output.draft,
      "",
      output.cta,
      output.hashtags.length ? output.hashtags.map((h) => `#${h}`).join(" ") : "",
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(txt);
    toast.success("Đã copy");
  };

  const saveToPlanner = () => {
    if (!output) return;
    const platformMatch =
      config.platforms.find((p) => p.toLowerCase().includes(form.platform.toLowerCase())) ??
      config.platforms[0] ??
      "";
    const formatMatch =
      form.format === "Reel/TikTok script"
        ? config.formats.find((f) => f.toLowerCase().includes("ngắn")) ?? config.formats[0]
        : form.format === "Carousel outline"
        ? config.formats.find((f) => f.toLowerCase().includes("ảnh")) ?? config.formats[0]
        : config.formats.find((f) => f.toLowerCase().includes("bài")) ?? config.formats[0];
    const draftStatus =
      config.statuses.find((s) => s.toLowerCase().includes("soạn")) ??
      config.statuses.find((s) => s.toLowerCase().includes("ý tưởng")) ??
      config.statuses[0] ??
      "";

    const row: PlannerRow = {
      id: pid(),
      title: (form.idea || form.keyMessage || "AI draft").slice(0, 120),
      assignee: config.assignees[0] ?? "",
      status: draftStatus,
      contentType: config.contentTypes[0] ?? "",
      platform: platformMatch ?? "",
      format: formatMatch ?? "",
      goal: config.goals[0] ?? "",
      body: [output.draft, "", output.cta].filter(Boolean).join("\n"),
      hashtag: output.hashtags.map((h) => `#${h}`).join(" "),
      note: `Tone: ${form.tone} · Goal: ${form.goal}\n${output.rationale}`,
      createdAt: Date.now(),
    };
    setRows((p) => [row, ...p]);
    toast.success("Đã lưu vào Content Planner");
  };

  return (
    <div>
      <PageHeader
        eyebrow="AI Draft Writer"
        title="Ý tưởng → Bản nháp, trong 10 giây."
        description="Điền brief, AI viết hook, caption hoặc script, đề xuất CTA & hashtag. Lưu thẳng vào Content Planner."
      />

      <div className="grid gap-6 px-6 py-8 md:px-10 lg:grid-cols-[420px,1fr]">
        {/* FORM */}
        <Card className="space-y-4 p-5">
          <Field label="Ý tưởng nội dung *" hint="Mô tả ngắn ý tưởng / topic">
            <Textarea rows={3} value={form.idea} onChange={(e) => set("idea", e.target.value)} placeholder="Ví dụ: Cách chọn niềng răng phù hợp cho người đi làm bận rộn" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Brand">
              <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </Field>
            <Field label="Ngành (optional)">
              <Input value={form.industry} onChange={(e) => set("industry", e.target.value)} placeholder="healthcare, food..." />
            </Field>
          </div>
          <Field label="Đối tượng">
            <Input value={form.audience} onChange={(e) => set("audience", e.target.value)} placeholder="Nữ 25-35, văn phòng, quan tâm thẩm mỹ" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Platform">
              <Pick value={form.platform} onChange={(v) => set("platform", v as DraftInput["platform"])} options={PLATFORMS} />
            </Field>
            <Field label="Format">
              <Pick value={form.format} onChange={(v) => set("format", v as DraftInput["format"])} options={FORMATS} />
            </Field>
            <Field label="Tone of voice">
              <Pick value={form.tone} onChange={(v) => set("tone", v as DraftInput["tone"])} options={TONES} />
            </Field>
            <Field label="Main goal">
              <Pick value={form.goal} onChange={(v) => set("goal", v as DraftInput["goal"])} options={GOALS} />
            </Field>
          </div>

          <Field label="Key message">
            <Input value={form.keyMessage} onChange={(e) => set("keyMessage", e.target.value)} />
          </Field>
          <Field label="Call-to-action">
            <Input value={form.cta} onChange={(e) => set("cta", e.target.value)} placeholder="Inbox để được tư vấn miễn phí" />
          </Field>
          <Field label="Notes (optional)">
            <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>

          <Button onClick={() => run()} disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {loading ? "Đang viết..." : "Generate Draft"}
          </Button>
        </Card>

        {/* OUTPUT */}
        <div className="space-y-4">
          {!output && !loading && (
            <Card className="flex h-full min-h-96 flex-col items-center justify-center border-dashed bg-surface/40 p-10 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-4 font-display text-xl">Bản nháp sẽ xuất hiện ở đây.</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Điền brief bên trái, bấm <b>Generate Draft</b>. AI sẽ trả về 3 hook, 1 bản nháp, CTA, hashtag và lý do vì sao cấu trúc này hiệu quả.
              </p>
            </Card>
          )}

          {loading && (
            <Card className="flex h-full min-h-96 flex-col items-center justify-center p-10 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-growth" />
              <p className="mt-3 text-sm text-muted-foreground">Đang viết bản nháp...</p>
            </Card>
          )}

          {output && (
            <>
              {output.safetyNote && (
                <Card className="flex gap-3 border-amber-500/40 bg-amber-50/40 p-4 dark:bg-amber-500/5">
                  <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-500">Healthcare safety note</p>
                    <p className="mt-1 text-sm text-foreground/90">{output.safetyNote}</p>
                  </div>
                </Card>
              )}

              <Card className="p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">3 Hook options</p>
                <ol className="mt-2 space-y-2 text-sm">
                  {output.hooks.map((h, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-md border border-border/50 bg-surface/40 p-3">
                      <span className="font-display text-lg text-growth">{i + 1}</span>
                      <span className="flex-1">{h}</span>
                      <button onClick={() => { navigator.clipboard.writeText(h); toast.success("Đã copy hook"); }} className="text-muted-foreground hover:text-foreground">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ol>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Draft · {form.format}</p>
                  <Button size="sm" variant="ghost" className="gap-1" onClick={copyAll}>
                    <Copy className="h-3.5 w-3.5" /> Copy all
                  </Button>
                </div>
                <Textarea
                  value={output.draft}
                  onChange={(e) => setOutput({ ...output, draft: e.target.value })}
                  rows={Math.min(20, Math.max(8, output.draft.split("\n").length + 2))}
                  className="mt-2 font-mono text-sm leading-relaxed"
                />
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Suggested CTA</p>
                    <Input value={output.cta} onChange={(e) => setOutput({ ...output, cta: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Hashtags</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {output.hashtags.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                      {output.hashtags.map((h, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">#{h}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Why this structure works</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{output.rationale}</p>
              </Card>

              <div className="flex flex-wrap items-center gap-2">
                <RefineBtn icon={RefreshCw} label="Regenerate" onClick={() => run("regenerate")} loading={refining === "regenerate"} />
                <RefineBtn icon={Scissors} label="Make shorter" onClick={() => run("shorter")} loading={refining === "shorter"} />
                <RefineBtn icon={Flame} label="More persuasive" onClick={() => run("more_persuasive")} loading={refining === "more_persuasive"} />
                <RefineBtn icon={Coffee} label="More casual" onClick={() => run("more_casual")} loading={refining === "more_casual"} />
                <Button onClick={saveToPlanner} className="ml-auto gap-2">
                  <Save className="h-4 w-4" /> Save to Content Planner
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      {hint && <p className="mb-1 mt-0.5 text-[10px] text-muted-foreground/70">{hint}</p>}
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Pick({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o} className="text-sm">{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function RefineBtn({ icon: Icon, label, onClick, loading }: { icon: typeof RefreshCw; label: string; onClick: () => void; loading: boolean }) {
  return (
    <Button size="sm" variant="outline" onClick={onClick} disabled={loading} className="gap-1.5">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}
