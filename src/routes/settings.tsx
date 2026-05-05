import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Send, Play, Pause, Square, Check } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  useAccount,
  useBackground,
  useSoundSettings,
  useDataPrefs,
} from "@/lib/settings";
import { BACKGROUNDS } from "@/lib/backgrounds";
import {
  SOUNDS,
  playFocusSound,
  setFocusVolume,
  stopFocusSound,
  getFocusState,
  subscribeFocus,
} from "@/lib/focusSound";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Growth Lab" },
      { name: "description", content: "Tài khoản, chia sẻ, giao diện và âm thanh tập trung." },
    ],
  }),
  component: SettingsPage,
});

interface Invite {
  id: string;
  email: string;
  permission: "view" | "comment" | "edit";
  status: "pending" | "accepted" | "revoked";
  invited_at: string;
}

const inviteSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ").max(255),
  permission: z.enum(["view", "comment", "edit"]),
});

function SettingsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Cấu hình"
        title="Settings"
        description="Tài khoản, chia sẻ workflow, giao diện và âm thanh tập trung."
      />
      <div className="px-6 py-6 md:px-10">
        <Tabs defaultValue="account">
          <TabsList className="flex-wrap">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="share">Share workflow</TabsTrigger>
            <TabsTrigger value="appearance">Dashboard appearance</TabsTrigger>
            <TabsTrigger value="sound">Focus sound</TabsTrigger>
            <TabsTrigger value="data">Data & preferences</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="mt-6"><AccountSection /></TabsContent>
          <TabsContent value="share" className="mt-6"><ShareSection /></TabsContent>
          <TabsContent value="appearance" className="mt-6"><AppearanceSection /></TabsContent>
          <TabsContent value="sound" className="mt-6"><SoundSection /></TabsContent>
          <TabsContent value="data" className="mt-6"><DataSection /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AccountSection() {
  const [account, setAccount] = useAccount();
  return (
    <Card className="max-w-xl border-border/60 p-6">
      <h3 className="font-display text-lg">Tài khoản</h3>
      <p className="mt-1 text-sm text-muted-foreground">Thông tin hiển thị trong dashboard.</p>
      <div className="mt-5 grid gap-4">
        <div>
          <Label>Tên hiển thị</Label>
          <Input
            className="mt-1"
            value={account.displayName}
            maxLength={60}
            onChange={(e) => setAccount((p) => ({ ...p, displayName: e.target.value }))}
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            className="mt-1"
            type="email"
            value={account.email}
            maxLength={255}
            onChange={(e) => setAccount((p) => ({ ...p, email: e.target.value }))}
            placeholder="you@example.com"
          />
        </div>
      </div>
    </Card>
  );
}

function ShareSection() {
  const [list, setList] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [perm, setPerm] = useState<Invite["permission"]>("view");
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("shared_invites")
      .select("*")
      .order("invited_at", { ascending: false });
    if (error) toast.error(error.message);
    else setList((data ?? []) as Invite[]);
  }
  useEffect(() => { load(); }, []);

  async function send() {
    const parsed = inviteSchema.safeParse({ email, permission: perm });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("shared_invites").insert({
      email: parsed.data.email,
      permission: parsed.data.permission,
      status: "pending",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(`Đã gửi lời mời tới ${parsed.data.email}`);
    setEmail("");
    load();
  }

  async function revoke(id: string) {
    const { error } = await supabase.from("shared_invites").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Đã thu hồi quyền truy cập");
    load();
  }

  async function markAccepted(id: string) {
    const { error } = await supabase
      .from("shared_invites")
      .update({ status: "accepted" })
      .eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
      <Card className="border-border/60 p-6">
        <h3 className="font-display text-lg">Mời bạn bè</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Chia sẻ workflow qua Gmail. Quyền sẽ kiểm soát mức truy cập.
        </p>
        <div className="mt-5 grid gap-3">
          <div>
            <Label>Email</Label>
            <Input
              className="mt-1"
              type="email"
              placeholder="friend@gmail.com"
              value={email}
              maxLength={255}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label>Quyền truy cập</Label>
            <Select value={perm} onValueChange={(v) => setPerm(v as Invite["permission"])}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View only</SelectItem>
                <SelectItem value="comment">Can comment</SelectItem>
                <SelectItem value="edit">Can edit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={send} disabled={loading} className="gap-2 self-start">
            <Send className="h-4 w-4" /> Send invite
          </Button>
        </div>
      </Card>

      <Card className="border-border/60 p-6">
        <h3 className="font-display text-lg">Đang có quyền truy cập</h3>
        {list.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
            Chưa có ai. Mời người đầu tiên ở bên trái.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border/60">
            {list.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {permLabel(inv.permission)} ·{" "}
                    {new Date(inv.invited_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={inv.status === "accepted" ? "default" : "secondary"}>
                    {inv.status}
                  </Badge>
                  {inv.status === "pending" && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => markAccepted(inv.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => revoke(inv.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function permLabel(p: Invite["permission"]) {
  return { view: "View only", comment: "Can comment", edit: "Can edit" }[p];
}

function AppearanceSection() {
  const [bg, setBg] = useBackground();
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
      <Card className="border-border/60 p-6">
        <h3 className="font-display text-lg">Background gallery</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Chọn không gian cho dashboard. Tất cả là tranh gốc, không sao chép tác phẩm bản quyền.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
          {BACKGROUNDS.map((b) => {
            const active = bg.id === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setBg((p) => ({ ...p, id: b.id }))}
                className={`group relative overflow-hidden rounded-xl border text-left transition ${
                  active ? "border-primary ring-2 ring-primary/40" : "border-border/60 hover:border-foreground/40"
                }`}
              >
                <div className="aspect-video w-full bg-muted">
                  {b.src ? (
                    <img src={b.src} alt={b.label} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">No background</div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-sm font-medium">{b.label}</p>
                  <p className="text-[11px] text-muted-foreground">{b.hint}</p>
                </div>
                {b.animated && (
                  <span className="absolute right-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium">
                    animated
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="border-border/60 p-6">
        <h3 className="font-display text-lg">Overlay & độ mờ</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Đảm bảo nội dung dashboard luôn dễ đọc.
        </p>
        <div className="mt-5 grid gap-5">
          <div>
            <Label>Lớp phủ</Label>
            <Select value={bg.overlay} onValueChange={(v) => setBg((p) => ({ ...p, overlay: v as never }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không</SelectItem>
                <SelectItem value="light">Trắng mờ</SelectItem>
                <SelectItem value="dark">Tối mờ</SelectItem>
                <SelectItem value="cream">Kem ấm</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Độ phủ</Label>
              <span className="text-xs text-muted-foreground">{bg.overlayStrength}%</span>
            </div>
            <Slider
              value={[bg.overlayStrength]}
              max={100}
              step={1}
              onValueChange={([v]) => setBg((p) => ({ ...p, overlayStrength: v }))}
              className="mt-2"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Blur (px)</Label>
              <span className="text-xs text-muted-foreground">{bg.blur}px</span>
            </div>
            <Slider
              value={[bg.blur]}
              max={20}
              step={1}
              onValueChange={([v]) => setBg((p) => ({ ...p, blur: v }))}
              className="mt-2"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

function SoundSection() {
  const [sound, setSound] = useSoundSettings();
  const [, force] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(20 * 60);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    const unsub = subscribeFocus(() => force((n) => n + 1));
    return () => { unsub; };
  }, []);

  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          setTimerActive(false);
          if (!sound.loopForever) stopFocusSound();
          toast.success("Hết phiên 20 phút focus 🎉");
          return 20 * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerActive, sound.loopForever]);

  const state = getFocusState();
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <Card className="max-w-2xl border-border/60 p-6">
      <h3 className="font-display text-lg">Focus sound</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        7 âm thanh ambient. Mặc định mỗi phiên 20 phút.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SOUNDS.map((s) => {
          const active = sound.selectedId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => {
                setSound((p) => ({ ...p, selectedId: s.id }));
                if (state.isPlaying) playFocusSound(s.id, sound.volume);
              }}
              className={`rounded-xl border p-3 text-left transition ${
                active ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted"
              }`}
            >
              <span className="text-2xl">{s.emoji}</span>
              <p className="mt-1 text-sm font-medium">{s.label}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button
          onClick={() => {
            const id = sound.selectedId ?? SOUNDS[0].id;
            if (state.isPlaying) stopFocusSound();
            else playFocusSound(id, sound.volume);
          }}
          className="gap-2"
        >
          {state.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {state.isPlaying ? "Tạm dừng" : "Phát"}
        </Button>
        <Button variant="outline" onClick={stopFocusSound} className="gap-2">
          <Square className="h-4 w-4" /> Dừng
        </Button>
        <div className="ml-auto font-display text-2xl tabular-nums">
          {mm}:{ss}
        </div>
        <Button
          variant={timerActive ? "outline" : "default"}
          onClick={() => {
            if (!timerActive && !state.isPlaying) {
              playFocusSound(sound.selectedId ?? SOUNDS[0].id, sound.volume);
            }
            setTimerActive((t) => !t);
          }}
        >
          {timerActive ? "Hủy timer" : "Bắt đầu 20 phút"}
        </Button>
      </div>

      <div className="mt-5 grid gap-4">
        <div>
          <div className="flex items-center justify-between">
            <Label>Volume</Label>
            <span className="text-xs text-muted-foreground">{sound.volume}</span>
          </div>
          <Slider
            value={[sound.volume]}
            max={100}
            step={1}
            onValueChange={([v]) => {
              setSound((p) => ({ ...p, volume: v }));
              setFocusVolume(v);
            }}
            className="mt-2"
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
          <div>
            <Label>Lặp vô tận khi hết timer</Label>
            <p className="text-xs text-muted-foreground">Tắt nếu muốn tự dừng sau 20 phút.</p>
          </div>
          <Switch
            checked={sound.loopForever}
            onCheckedChange={(c) => setSound((p) => ({ ...p, loopForever: c }))}
          />
        </div>
      </div>
    </Card>
  );
}

function DataSection() {
  const [prefs, setPrefs] = useDataPrefs();
  return (
    <Card className="max-w-xl border-border/60 p-6">
      <h3 className="font-display text-lg">Data & preferences</h3>
      <div className="mt-5 grid gap-4">
        <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
          <div>
            <Label>Giảm chuyển động</Label>
            <p className="text-xs text-muted-foreground">Tắt animation nền.</p>
          </div>
          <Switch
            checked={prefs.reduceMotion}
            onCheckedChange={(c) => setPrefs((p) => ({ ...p, reduceMotion: c }))}
          />
        </div>
        <div>
          <Label>Ngôn ngữ</Label>
          <Select value={prefs.language} onValueChange={(v) => setPrefs((p) => ({ ...p, language: v as never }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vi">Tiếng Việt</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="destructive"
          className="self-start"
          onClick={() => {
            if (!confirm("Xoá toàn bộ dữ liệu cục bộ? Không thể hoàn tác.")) return;
            Object.keys(localStorage)
              .filter((k) => k.startsWith("gl_"))
              .forEach((k) => localStorage.removeItem(k));
            location.reload();
          }}
        >
          Xoá dữ liệu cục bộ
        </Button>
      </div>
    </Card>
  );
}
