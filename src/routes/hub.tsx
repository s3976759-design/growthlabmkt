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
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtSize(f.size)} · {f.updated ? new Date(f.updated).toLocaleString("vi-VN") : "—"}
                  </p>
                </div>
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
    </div>
  );
}
