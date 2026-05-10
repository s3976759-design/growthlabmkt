import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { z } from "zod";
import { PageHeader } from "@/components/PageHeader";
import { useT } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useContents, useIdeas, uid, type ContentItem } from "@/lib/storage";
import { usePlannerConfig, upsertPlannerRow, deletePlannerRow } from "@/lib/planner";
import { Save, Sparkles, History, Trash2, FileText, Workflow } from "lucide-react";
import { toast } from "sonner";

const search = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/execute")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Execute — Growth Lab" },
      { name: "description", content: "Write captions, save versions, attach goals." },
    ],
  }),
  component: ExecutePage,
});

const HOOKS = [
  "Did you know… [statistic shock]?",
  "3 mistakes that make you…",
  "I tried [X] for 7 days, here are the results",
  "Don't do [X] until you know this",
  "The secret the [X] industry doesn't want you to know",
];
const CTAS = [
  "Save this for later 👇",
  "What do you think? Drop a comment.",
  "Share with someone who needs this.",
  "Follow for part 2.",
  "DM 'Yes' to get the template.",
];

function ExecutePage() {
  const t = useT();
  const navigate = useNavigate();
  const { id } = Route.useSearch();
  const [contents, setContents] = useContents();
  const [ideas] = useIdeas();
  const { config } = usePlannerConfig();

  const editing = useMemo(() => contents.find((c) => c.id === id), [contents, id]);
  const isNew = !editing;

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platform, setPlatform] = useState<string>(config.platforms[0] ?? "");
  const [format, setFormat] = useState<string>(config.formats[0] ?? "");
  const [goal, setGoal] = useState<string>(config.goals[0] ?? "");
  const [status, setStatus] = useState<string>(config.statuses[0] ?? "");
  const [assignee, setAssignee] = useState<string>(config.assignees[0] ?? "");
  const [contentType, setContentType] = useState<string>(config.contentTypes[0] ?? "");
  const [demoDate, setDemoDate] = useState<string>("");
  const [demoTime, setDemoTime] = useState<string>("");
  const [postDate, setPostDate] = useState<string>("");
  const [postTime, setPostTime] = useState<string>("");
  const [ideaId, setIdeaId] = useState<string>("none");

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setCaption(editing.caption);
      setHashtags(editing.hashtags ?? "");
      setPlatform(editing.platform);
      setFormat(editing.format);
      setGoal(editing.goal);
      setStatus(editing.status);
      setAssignee(editing.assignee ?? config.assignees[0] ?? "");
      setContentType(editing.contentType ?? config.contentTypes[0] ?? "");
      setDemoDate(editing.demoDate ?? "");
      setDemoTime(editing.demoTime ?? "");
      setPostDate(editing.postDate ?? "");
      setPostTime(editing.postTime ?? "");
      setIdeaId(editing.ideaId ?? "none");
    } else {
      setTitle(""); setCaption(""); setHashtags("");
      setPlatform(config.platforms[0] ?? "");
      setFormat(config.formats[0] ?? "");
      setGoal(config.goals[0] ?? "");
      setStatus(config.statuses[0] ?? "");
      setAssignee(config.assignees[0] ?? "");
      setContentType(config.contentTypes[0] ?? "");
      setDemoDate(""); setDemoTime(""); setPostDate(""); setPostTime("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const syncToPlan = (item: ContentItem) => {
    upsertPlannerRow({
      id: item.id,
      title: item.title,
      status: item.status,
      assignee: item.assignee ?? "",
      contentType: item.contentType ?? "",
      platform: item.platform,
      format: item.format,
      goal: item.goal,
      demoDate: item.demoDate,
      demoTime: item.demoTime,
      postDate: item.postDate,
      postTime: item.postTime,
      body: item.caption,
      hashtag: item.hashtags,
    });
  };

  const save = () => {
    if (!title.trim()) {
      toast.error("A title is required");
      return;
    }
    const common = {
      title, caption, hashtags, platform, format, goal, status, assignee,
      contentType, demoDate, demoTime, postDate, postTime,
      ideaId: ideaId === "none" ? undefined : ideaId,
    };
    if (editing) {
      let updated: ContentItem | null = null;
      setContents((prev) =>
        prev.map((c) => {
          if (c.id !== editing.id) return c;
          const captionChanged = c.caption !== caption;
          updated = {
            ...c,
            ...common,
            postedAt: status === "posted" ? c.postedAt ?? Date.now() : c.postedAt,
            versions:
              captionChanged && c.caption
                ? [{ id: uid(), caption: c.caption, createdAt: Date.now() }, ...c.versions]
                : c.versions,
          };
          return updated;
        })
      );
      if (updated) syncToPlan(updated);
      toast.success("Updated & synced to Plan", {
        action: { label: "Pipeline", onClick: () => navigate({ to: "/pipeline" }) },
      });
    } else {
      const item: ContentItem = {
        id: uid(),
        ...common,
        versions: [],
        postedAt: status === "posted" ? Date.now() : undefined,
        createdAt: Date.now(),
      };
      setContents((prev) => [item, ...prev]);
      syncToPlan(item);
      toast.success("Saved to Pipeline & Plan", {
        action: { label: "Open Pipeline", onClick: () => navigate({ to: "/pipeline" }) },
      });
      navigate({ to: "/execute", search: { id: item.id } });
    }
  };

  const remove = () => {
    if (!editing) return;
    setContents((prev) => prev.filter((c) => c.id !== editing.id));
    deletePlannerRow(editing.id);
    toast.success("Deleted");
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
        eyebrow={t("execute.eyebrow")}
        title={editing ? t("execute.title.edit") : t("execute.title.new")}
        description={t("execute.desc")}
      >
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/pipeline"><Workflow className="h-4 w-4" /> Pipeline</Link>
        </Button>
        {editing && (
          <Button variant="ghost" size="sm" onClick={remove} className="gap-2 text-destructive">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        )}
        <Button onClick={save} className="gap-2"><Save className="h-4 w-4" /> Save</Button>
      </PageHeader>

      <div className="grid gap-6 px-6 py-8 md:px-10 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
        <Card className="border-border/60 bg-card p-4 shadow-soft">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Schedule & Classification (synced with Plan)
          </p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
            <MiniField label="STATUS">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{config.statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </MiniField>
            <MiniField label="CONTENT TYPE">
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{config.contentTypes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </MiniField>
            <MiniField label="PLATFORM">
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{config.platforms.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </MiniField>
            <MiniField label="FORMAT">
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{config.formats.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </MiniField>
            <MiniField label="GOAL">
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{config.goals.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </MiniField>
            <MiniField label="DEMO DATE">
              <Input type="date" value={demoDate} onChange={(e) => setDemoDate(e.target.value)} className="h-8 text-xs" />
            </MiniField>
            <MiniField label="DEMO TIME">
              <Input type="time" value={demoTime} onChange={(e) => setDemoTime(e.target.value)} className="h-8 text-xs" />
            </MiniField>
            <MiniField label="POST DATE">
              <Input type="date" value={postDate} onChange={(e) => setPostDate(e.target.value)} className="h-8 text-xs" />
            </MiniField>
            <MiniField label="POST TIME">
              <Input type="time" value={postTime} onChange={(e) => setPostTime(e.target.value)} className="h-8 text-xs" />
            </MiniField>
          </div>
        </Card>

        <Card className="border-border/60 bg-card p-6 shadow-soft">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title (private)…"
            className="border-0 bg-transparent px-0 font-display text-2xl font-medium shadow-none focus-visible:ring-0 md:text-3xl"
          />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={insertHook}>
              <Sparkles className="h-3.5 w-3.5 text-insight" /> Hook suggestion
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={insertCta}>
              <Sparkles className="h-3.5 w-3.5 text-growth" /> CTA suggestion
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">{caption.length} chars</span>
          </div>
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write the caption here…"
            rows={16}
            className="mt-3 resize-none border-border/60 bg-surface font-sans text-base leading-relaxed"
          />

          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Hashtags</span>
            <Input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#growth #marketing #brand"
              className="font-mono text-sm"
            />
          </label>

          {editing && editing.versions.length > 0 && (
            <div className="mt-6 border-t border-border/60 pt-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <History className="h-4 w-4" />
                <span className="font-medium">Previous versions ({editing.versions.length})</span>
              </div>
              <div className="mt-3 space-y-2">
                {editing.versions.slice(0, 3).map((v) => (
                  <div key={v.id} className="rounded-md border border-border/60 bg-surface/60 p-3">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{new Date(v.createdAt).toLocaleString("en-US")}</span>
                      <button
                        className="hover:text-foreground"
                        onClick={() => setCaption(v.caption)}
                      >
                        Restore
                      </button>
                    </div>
                    <p className="mt-1 line-clamp-3 text-xs leading-relaxed">{v.caption}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border/60 bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Links
              </p>
              <Link to="/plan" className="text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
                Edit lists in Plan → Settings
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              <Field label="Status">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {config.statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Assignee">
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {config.assignees.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="From idea (Brain)">
                <Select value={ideaId} onValueChange={setIdeaId}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {ideas.map((i) => <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Card>

          {!isNew && (
            <Card className="border-border/60 bg-surface/60 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Properties
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" /> {editing!.versions.length} versions</Badge>
                <Badge variant="outline">Created {new Date(editing!.createdAt).toLocaleDateString("en-US")}</Badge>
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

function MiniField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
