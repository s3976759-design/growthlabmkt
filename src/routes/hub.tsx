import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, FileText, Trash2, Download, Loader2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/hub")({
  head: () => ({
    meta: [
      { title: "Hub — Growth Lab" },
      { name: "description", content: "Document hub: upload và lưu trữ tài liệu của bạn." },
    ],
  }),
  component: HubPage,
});

interface FileItem {
  name: string;
  size: number;
  updated: string;
  url: string;
}

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function HubPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [preview, setPreview] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage
      .from("hub")
      .list("", { limit: 1000, sortBy: { column: "updated_at", order: "desc" } });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const items: FileItem[] = (data ?? [])
      .filter((f) => f.name && !f.name.startsWith("."))
      .map((f) => ({
        name: f.name,
        size: (f.metadata as { size?: number } | null)?.size ?? 0,
        updated: f.updated_at ?? f.created_at ?? "",
        url: supabase.storage.from("hub").getPublicUrl(f.name).data.publicUrl,
      }));
    setFiles(items);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const onUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    let ok = 0, fail = 0;
    for (const file of Array.from(fileList)) {
      const safe = `${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
      const { error } = await supabase.storage.from("hub").upload(safe, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) { fail++; toast.error(`${file.name}: ${error.message}`); }
      else ok++;
    }
    setUploading(false);
    if (ok) toast.success(`Đã upload ${ok} file`);
    if (fail) toast.error(`${fail} file thất bại`);
    void refresh();
  };

  const onDelete = async (name: string) => {
    if (!confirm(`Xoá "${name}"?`)) return;
    const { error } = await supabase.storage.from("hub").remove([name]);
    if (error) toast.error(error.message);
    else { toast.success("Đã xoá"); void refresh(); }
  };

  const filtered = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        eyebrow="Document Hub"
        title="Mọi tài liệu, một nơi."
        description="Upload brief, swipe, asset, file tham khảo. Truy cập nhanh từ mọi trang."
      >
        <label className="inline-flex">
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => onUpload(e.target.files)}
          />
          <Button asChild className="gap-2 cursor-pointer" disabled={uploading}>
            <span>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Đang upload..." : "Upload file"}
            </span>
          </Button>
        </label>
      </PageHeader>

      <div className="space-y-4 px-6 py-8 md:px-10">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); void onUpload(e.dataTransfer.files); }}
          className="rounded-xl border-2 border-dashed border-border/60 bg-surface/40 p-10 text-center"
        >
          <Upload className="mx-auto h-8 w-8 text-muted-foreground/60" />
          <p className="mt-2 text-sm text-muted-foreground">
            Kéo thả file vào đây, hoặc bấm <b>Upload file</b>
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Input
            placeholder="Tìm file..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <p className="text-xs text-muted-foreground">{filtered.length} / {files.length} file</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-sm text-muted-foreground">
            Chưa có file nào.
          </Card>
        ) : (
          <div className="grid gap-2">
            {filtered.map((f) => (
              <Card key={f.name} className="flex items-center gap-3 p-3">
                <button
                  onClick={() => setPreview(f)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent transition hover:bg-accent/70"
                  title="Xem trước"
                >
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </button>
                <button onClick={() => setPreview(f)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtSize(f.size)} · {f.updated ? new Date(f.updated).toLocaleString("vi-VN") : "—"}
                  </p>
                </button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setPreview(f)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                  <a href={f.url} target="_blank" rel="noreferrer" download={f.name}>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onDelete(f.name)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <FilePreviewDialog file={preview} onClose={() => setPreview(null)} />
    </div>
  );
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
    fetch(file.url)
      .then((r) => r.text())
      .then((t) => setText(t.slice(0, 200_000)))
      .catch(() => setText("Không thể đọc file."))
      .finally(() => setLoading(false));
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
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <pre className="whitespace-pre-wrap break-words rounded bg-surface/60 p-4 text-xs">{text}</pre>
            )
          ) : (
            <div className="space-y-3 py-8 text-center text-sm text-muted-foreground">
              <p>Không thể xem trước định dạng <code className="rounded bg-surface px-1.5 py-0.5">.{ext || "?"}</code> ngay trên trình duyệt.</p>
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
