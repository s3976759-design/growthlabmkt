import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useT } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Upload, FileText, Trash2, Download, Loader2, Eye, Folder, FolderPlus,
  Link as LinkIcon, Plus, Pencil, ChevronRight, Lock, ExternalLink, Home,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useHubSettings, sha256 } from "@/lib/settings";

export const Route = createFileRoute("/hub")({
  head: () => ({
    meta: [
      { title: "Hub — Growth Lab" },
      { name: "description", content: "Document hub: upload, folders, links, password protected." },
    ],
  }),
  component: HubPage,
});

interface FileItem {
  type: "file";
  name: string; // base name
  fullPath: string;
  size: number;
  updated: string;
  url: string;
}
interface FolderItem {
  type: "folder";
  name: string;
  fullPath: string;
}
interface LinkItem {
  type: "link";
  id: string;
  name: string;
  url: string;
}
type Entry = FileItem | FolderItem | LinkItem;

const KEEP = ".keep";
const SESSION_KEY = "gl_hub_unlocked";

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
function joinPath(a: string, b: string) {
  if (!a) return b;
  if (!b) return a;
  return `${a.replace(/\/$/, "")}/${b}`;
}

function HubPage() {
  const [hubSettings] = useHubSettings();
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!hubSettings.passwordEnabled) {
      setUnlocked(true);
      return;
    }
    setUnlocked(sessionStorage.getItem(SESSION_KEY) === "1");
  }, [hubSettings.passwordEnabled]);

  if (hubSettings.passwordEnabled && !unlocked) {
    return <UnlockGate hash={hubSettings.passwordHash} onUnlock={() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    }} />;
  }

  return <HubBrowser />;
}

function UnlockGate({ hash, onUnlock }: { hash: string | null; onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!hash) return onUnlock(); // misconfigured: allow
    setBusy(true);
    const h = await sha256(pw);
    setBusy(false);
    if (h === hash) onUnlock();
    else toast.error("Sai mật khẩu");
  }
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <Card className="w-full max-w-sm border-border/60 p-6">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          <h2 className="font-display text-lg">Hub được bảo vệ</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Nhập mật khẩu để xem tài liệu.
        </p>
        <div className="mt-4 grid gap-3">
          <Input
            type="password"
            value={pw}
            placeholder="Mật khẩu"
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoFocus
          />
          <Button onClick={submit} disabled={busy} className="gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Mở khoá
          </Button>
        </div>
      </Card>
    </div>
  );
}

function HubBrowser() {
  const t = useT();
  const [path, setPath] = useState<string>("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<FileItem | null>(null);
  const [renaming, setRenaming] = useState<Entry | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [addingLink, setAddingLink] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [{ data: storage, error: storageErr }, { data: links, error: linksErr }] = await Promise.all([
      supabase.storage.from("hub").list(path, { limit: 1000, sortBy: { column: "name", order: "asc" } }),
      supabase.from("hub_links").select("*").eq("parent_path", path).order("created_at", { ascending: false }),
    ]);
    if (storageErr) toast.error(storageErr.message);
    if (linksErr) toast.error(linksErr.message);

    const items: Entry[] = [];
    for (const f of storage ?? []) {
      if (!f.name || f.name === KEEP) continue;
      const isFolder = !f.metadata; // Supabase: folders have null metadata
      const fullPath = joinPath(path, f.name);
      if (isFolder) {
        items.push({ type: "folder", name: f.name, fullPath });
      } else {
        items.push({
          type: "file",
          name: f.name,
          fullPath,
          size: (f.metadata as { size?: number } | null)?.size ?? 0,
          updated: f.updated_at ?? f.created_at ?? "",
          url: supabase.storage.from("hub").getPublicUrl(fullPath).data.publicUrl,
        });
      }
    }
    for (const l of links ?? []) {
      items.push({ type: "link", id: l.id, name: l.title, url: l.url });
    }
    // folders first, then links, then files
    items.sort((a, b) => {
      const order = { folder: 0, link: 1, file: 2 } as const;
      if (order[a.type] !== order[b.type]) return order[a.type] - order[b.type];
      return a.name.localeCompare(b.name);
    });
    setEntries(items);
    setLoading(false);
  }, [path]);

  useEffect(() => { void refresh(); }, [refresh]);

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    let ok = 0, fail = 0;
    for (const file of Array.from(files)) {
      const safe = `${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
      const target = joinPath(path, safe);
      const { error } = await supabase.storage.from("hub").upload(target, file, {
        cacheControl: "3600", upsert: false,
      });
      if (error) { fail++; toast.error(`${file.name}: ${error.message}`); }
      else ok++;
    }
    setUploading(false);
    if (ok) toast.success(`Đã tải ${ok} file`);
    void refresh();
  };

  const onDeleteFile = async (item: FileItem) => {
    if (!confirm(`Xoá "${item.name}"?`)) return;
    const { error } = await supabase.storage.from("hub").remove([item.fullPath]);
    if (error) return toast.error(error.message);
    toast.success("Đã xoá");
    void refresh();
  };
  const onDeleteFolder = async (item: FolderItem) => {
    if (!confirm(`Xoá thư mục "${item.name}" và toàn bộ nội dung?`)) return;
    const all = await listAllUnder(item.fullPath);
    if (all.length) {
      const { error } = await supabase.storage.from("hub").remove(all);
      if (error) return toast.error(error.message);
    }
    toast.success("Đã xoá thư mục");
    void refresh();
  };
  const onDeleteLink = async (item: LinkItem) => {
    if (!confirm(`Xoá link "${item.name}"?`)) return;
    const { error } = await supabase.from("hub_links").delete().eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Đã xoá link");
    void refresh();
  };

  const breadcrumbs = path.split("/").filter(Boolean);
  const filtered = entries.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        eyebrow={t("hub.eyebrow")}
        title={t("hub.titlePage")}
        description={t("hub.desc")}
      >
        <Button variant="outline" className="gap-2" onClick={() => setCreatingFolder(true)}>
          <FolderPlus className="h-4 w-4" /> Thư mục
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => setAddingLink(true)}>
          <LinkIcon className="h-4 w-4" /> Thêm link
        </Button>
        <label className="inline-flex">
          <input type="file" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
          <Button asChild className="gap-2 cursor-pointer" disabled={uploading}>
            <span>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Đang tải..." : "Tải lên"}
            </span>
          </Button>
        </label>
      </PageHeader>

      <div className="space-y-4 px-6 py-8 md:px-10">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-1 text-sm">
          <button onClick={() => setPath("")} className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-accent">
            <Home className="h-3.5 w-3.5" /> Hub
          </button>
          {breadcrumbs.map((seg, i) => {
            const target = breadcrumbs.slice(0, i + 1).join("/");
            return (
              <span key={target} className="inline-flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                <button onClick={() => setPath(target)} className="rounded px-2 py-1 hover:bg-accent">
                  {seg}
                </button>
              </span>
            );
          })}
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); void onUpload(e.dataTransfer.files); }}
          className="rounded-xl border-2 border-dashed border-border/60 bg-surface/40 p-8 text-center"
        >
          <Upload className="mx-auto h-7 w-7 text-muted-foreground/60" />
          <p className="mt-2 text-sm text-muted-foreground">Kéo thả file vào đây để tải lên</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Input placeholder="Tìm..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          <p className="text-xs text-muted-foreground">{filtered.length} mục</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-sm text-muted-foreground">Chưa có gì ở đây.</Card>
        ) : (
          <div className="grid gap-2">
            {filtered.map((e) => (
              <EntryRow
                key={`${e.type}:${e.type === "link" ? e.id : (e as FileItem | FolderItem).fullPath}`}
                entry={e}
                onOpen={() => {
                  if (e.type === "folder") setPath(e.fullPath);
                  else if (e.type === "file") setPreview(e);
                  else window.open(e.url, "_blank", "noreferrer");
                }}
                onRename={() => setRenaming(e)}
                onDelete={() => {
                  if (e.type === "file") onDeleteFile(e);
                  else if (e.type === "folder") onDeleteFolder(e);
                  else onDeleteLink(e);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <FilePreviewDialog file={preview} onClose={() => setPreview(null)} />
      <RenameDialog
        entry={renaming}
        currentPath={path}
        onClose={() => setRenaming(null)}
        onDone={() => { setRenaming(null); void refresh(); }}
      />
      <NewFolderDialog
        open={creatingFolder}
        currentPath={path}
        onClose={() => setCreatingFolder(false)}
        onDone={() => { setCreatingFolder(false); void refresh(); }}
      />
      <AddLinkDialog
        open={addingLink}
        currentPath={path}
        onClose={() => setAddingLink(false)}
        onDone={() => { setAddingLink(false); void refresh(); }}
      />
    </div>
  );
}

function EntryRow({
  entry, onOpen, onRename, onDelete,
}: {
  entry: Entry;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const Icon = entry.type === "folder" ? Folder : entry.type === "link" ? LinkIcon : FileText;
  return (
    <Card className="flex items-center gap-3 p-3">
      <button onClick={onOpen}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent transition hover:bg-accent/70">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </button>
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium">{entry.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {entry.type === "file"
            ? `${fmtSize(entry.size)} · ${entry.updated ? new Date(entry.updated).toLocaleString("vi-VN") : "—"}`
            : entry.type === "link"
              ? entry.url
              : "Thư mục"}
        </p>
      </button>
      {entry.type === "file" && (
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onOpen} title="Xem trước">
          <Eye className="h-4 w-4" />
        </Button>
      )}
      {entry.type === "file" && (
        <Button asChild size="icon" variant="ghost" className="h-8 w-8">
          <a href={entry.url} target="_blank" rel="noreferrer" download={entry.name}>
            <Download className="h-4 w-4" />
          </a>
        </Button>
      )}
      {entry.type === "link" && (
        <Button asChild size="icon" variant="ghost" className="h-8 w-8">
          <a href={entry.url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
        </Button>
      )}
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onRename} title="Đổi tên">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onDelete}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </Card>
  );
}

function NewFolderDialog({
  open, currentPath, onClose, onDone,
}: { open: boolean; currentPath: string; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    const safe = name.trim().replace(/[\\/]/g, "_");
    if (!safe) return;
    setBusy(true);
    const placeholder = joinPath(joinPath(currentPath, safe), KEEP);
    const { error } = await supabase.storage.from("hub")
      .upload(placeholder, new Blob([""]), { contentType: "text/plain", upsert: true });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Đã tạo thư mục");
    setName("");
    onDone();
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Thư mục mới</DialogTitle></DialogHeader>
        <div className="grid gap-2">
          <Label>Tên thư mục</Label>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Ví dụ: Briefs" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button onClick={submit} disabled={busy}>Tạo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddLinkDialog({
  open, currentPath, onClose, onDone,
}: { open: boolean; currentPath: string; onClose: () => void; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!title.trim() || !url.trim()) return toast.error("Cần tên và URL");
    setBusy(true);
    const { error } = await supabase.from("hub_links").insert({
      parent_path: currentPath, title: title.trim(), url: url.trim(),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Đã thêm link");
    setTitle(""); setUrl("");
    onDone();
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Thêm link</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Tên hiển thị</Label>
            <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief Q3" />
          </div>
          <div>
            <Label>URL</Label>
            <Input className="mt-1" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button onClick={submit} disabled={busy}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RenameDialog({
  entry, currentPath, onClose, onDone,
}: { entry: Entry | null; currentPath: string; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setName(entry?.name ?? ""); }, [entry]);
  if (!entry) return null;
  const e = entry;

  async function submit() {
    const safe = name.trim().replace(/[\\/]/g, "_");
    if (!safe || safe === e.name) return onClose();
    setBusy(true);
    try {
      if (e.type === "file") {
        const target = joinPath(currentPath, safe);
        const { error } = await supabase.storage.from("hub").move(e.fullPath, target);
        if (error) throw error;
      } else if (e.type === "folder") {
        const all = await listAllUnder(e.fullPath);
        const oldPrefix = e.fullPath;
        const newPrefix = joinPath(currentPath, safe);
        for (const old of all) {
          const next = newPrefix + old.slice(oldPrefix.length);
          const { error } = await supabase.storage.from("hub").move(old, next);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.from("hub_links").update({ title: safe }).eq("id", e.id);
        if (error) throw error;
      }
      toast.success("Đã đổi tên");
      onDone();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={!!entry} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi tên</DialogTitle>
          <DialogDescription className="text-xs">
            {entry.type === "folder" ? "Đổi tên thư mục sẽ di chuyển toàn bộ nội dung bên trong." : ""}
          </DialogDescription>
        </DialogHeader>
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()} />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button onClick={submit} disabled={busy}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function listAllUnder(prefix: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(p: string) {
    const { data } = await supabase.storage.from("hub").list(p, { limit: 1000 });
    for (const f of data ?? []) {
      const full = joinPath(p, f.name);
      if (!f.metadata) await walk(full);
      else out.push(full);
    }
  }
  await walk(prefix);
  return out;
}

function getExt(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function FilePreviewDialog({ file, onClose }: { file: FileItem | null; onClose: () => void }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ext = file ? getExt(file.name) : "";
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"].includes(ext);
  const isPdf = ext === "pdf";
  const isVideo = ["mp4", "webm", "mov"].includes(ext);
  const isAudio = ["mp3", "wav", "ogg", "m4a"].includes(ext);
  const isText = ["txt", "md", "json", "csv", "log", "yaml", "yml", "html", "xml"].includes(ext);

  useEffect(() => {
    setText(null);
    if (!file || !isText) return;
    setLoading(true);
    fetch(file.url).then((r) => r.text()).then((t) => setText(t.slice(0, 200_000)))
      .catch(() => setText("Không thể đọc file.")).finally(() => setLoading(false));
  }, [file, isText]);

  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="truncate pr-8 font-display text-base">{file?.name}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[75vh] overflow-auto">
          {!file ? null : isImage ? (
            <img src={file.url} alt={file.name} className="mx-auto max-h-[70vh] rounded" />
          ) : isPdf ? (
            <iframe src={file.url} title={file.name} className="h-[75vh] w-full rounded border border-border/60" />
          ) : isVideo ? (
            <video src={file.url} controls className="mx-auto max-h-[70vh] w-full rounded" />
          ) : isAudio ? (
            <audio src={file.url} controls className="w-full" />
          ) : isText ? (
            loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : (
              <pre className="whitespace-pre-wrap break-words rounded bg-surface/60 p-4 text-xs">{text}</pre>
            )
          ) : (
            <div className="space-y-3 py-8 text-center text-sm text-muted-foreground">
              <p>Không thể xem trước <code className="rounded bg-surface px-1.5 py-0.5">.{ext || "?"}</code>.</p>
              <Button asChild>
                <a href={file.url} target="_blank" rel="noreferrer" download={file.name}>
                  <Download className="mr-2 h-4 w-4" /> Tải xuống
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// keep imports honest
void Plus;
