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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Send, Play, Pause, Square, Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  useAccount, useSoundSettings, useHubSettings, sha256,
} from "@/lib/settings";
import {
  SOUNDS, playFocusSound, setFocusVolume, stopFocusSound, getFocusState, subscribeFocus,
} from "@/lib/focusSound";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — Growth Lab" }],
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
      <PageHeader eyebrow="Cấu hình" title="Settings"
        description="Tài khoản, chia sẻ workflow, âm thanh tập trung, mật khẩu Hub." />
      <div className="px-6 py-6 md:px-10">
        <Tabs defaultValue="account">
          <TabsList className="flex-wrap">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="share">Share workflow</TabsTrigger>
            <TabsTrigger value="sound">Focus sound</TabsTrigger>
            <TabsTrigger value="hub">Hub</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="mt-6"><AccountSection /></TabsContent>
          <TabsContent value="share" className="mt-6"><ShareSection /></TabsContent>
          <TabsContent value="sound" className="mt-6"><SoundSection /></TabsContent>
          <TabsContent value="hub" className="mt-6"><HubSection /></TabsContent>
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
      <p className="mt-1 text-sm text-muted-foreground">
        Tên hiển thị này sẽ xuất hiện ở dashboard ("Hello, {account.displayName || "..."}").
      </p>
      <div className="mt-5 grid gap-4">
        <div>
          <Label>Tên hiển thị</Label>
          <Input className="mt-1" value={account.displayName} maxLength={60}
            onChange={(e) => setAccount((p) => ({ ...p, displayName: e.target.value }))} />
        </div>
        <div>
          <Label>Email</Label>
          <Input className="mt-1" type="email" value={account.email} maxLength={255}
            placeholder="you@example.com"
            onChange={(e) => setAccount((p) => ({ ...p, email: e.target.value }))} />
        </div>
      </div>
    </Card>
  );
}

function ShareSection() {
  const [account] = useAccount();
  const [list, setList] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [perm, setPerm] = useState<Invite["permission"]>("view");
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data, error } = await supabase.from("shared_invites").select("*")
      .order("invited_at", { ascending: false });
    if (error) toast.error(error.message);
    else setList((data ?? []) as Invite[]);
  }
  useEffect(() => { load(); }, []);

  async function send() {
    const parsed = inviteSchema.safeParse({ email, permission: perm });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
    setLoading(true);
    const { error } = await supabase.from("shared_invites").insert({
      email: parsed.data.email, permission: parsed.data.permission, status: "pending",
    });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    // fire email
    const { data: emailRes, error: fnErr } = await supabase.functions.invoke("send-invite", {
      body: {
        email: parsed.data.email,
        permission: parsed.data.permission,
        inviter: account.displayName || "Growth Lab",
      },
    });
    setLoading(false);
    if (fnErr) {
      toast.warning(`Đã lưu lời mời, nhưng email chưa gửi: ${fnErr.message}`);
    } else if ((emailRes as { error?: string } | null)?.error) {
      toast.warning(`Đã lưu lời mời, nhưng email chưa gửi: ${(emailRes as { error: string }).error}`);
    } else {
      toast.success(`Đã gửi email mời tới ${parsed.data.email}`);
    }
    setEmail("");
    load();
  }

  async function revoke(id: string) {
    const { error } = await supabase.from("shared_invites").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Đã thu hồi"); load();
  }
  async function markAccepted(id: string) {
    const { error } = await supabase.from("shared_invites").update({ status: "accepted" }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
      <Card className="border-border/60 p-6">
        <h3 className="font-display text-lg">Mời bạn bè</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Lời mời sẽ được gửi qua email tới người nhận.
        </p>
        <div className="mt-5 grid gap-3">
          <div>
            <Label>Email</Label>
            <Input className="mt-1" type="email" placeholder="friend@gmail.com"
              value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} />
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
                  <Badge variant={inv.status === "accepted" ? "default" : "secondary"}>{inv.status}</Badge>
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

function SoundSection() {
  const [sound, setSound] = useSoundSettings();
  const [, force] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(20 * 60);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => { const unsub = subscribeFocus(() => force((n) => n + 1)); return () => { unsub; }; }, []);

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
      <p className="mt-1 text-sm text-muted-foreground">7 âm thanh ambient. Mặc định mỗi phiên 20 phút.</p>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SOUNDS.map((s) => {
          const active = sound.selectedId === s.id;
          return (
            <button key={s.id}
              onClick={() => {
                setSound((p) => ({ ...p, selectedId: s.id }));
                if (state.isPlaying) playFocusSound(s.id, sound.volume);
              }}
              className={`rounded-xl border p-3 text-left transition ${active ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted"}`}>
              <span className="text-2xl">{s.emoji}</span>
              <p className="mt-1 text-sm font-medium">{s.label}</p>
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={() => {
          const id = sound.selectedId ?? SOUNDS[0].id;
          if (state.isPlaying) stopFocusSound(); else playFocusSound(id, sound.volume);
        }} className="gap-2">
          {state.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {state.isPlaying ? "Tạm dừng" : "Phát"}
        </Button>
        <Button variant="outline" onClick={stopFocusSound} className="gap-2">
          <Square className="h-4 w-4" /> Dừng
        </Button>
        <div className="ml-auto font-display text-2xl tabular-nums">{mm}:{ss}</div>
        <Button variant={timerActive ? "outline" : "default"} onClick={() => {
          if (!timerActive && !state.isPlaying) playFocusSound(sound.selectedId ?? SOUNDS[0].id, sound.volume);
          setTimerActive((t) => !t);
        }}>
          {timerActive ? "Hủy timer" : "Bắt đầu 20 phút"}
        </Button>
      </div>
      <div className="mt-5 grid gap-4">
        <div>
          <div className="flex items-center justify-between">
            <Label>Volume</Label>
            <span className="text-xs text-muted-foreground">{sound.volume}</span>
          </div>
          <Slider value={[sound.volume]} max={100} step={1}
            onValueChange={([v]) => { setSound((p) => ({ ...p, volume: v })); setFocusVolume(v); }}
            className="mt-2" />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
          <div>
            <Label>Lặp vô tận khi hết timer</Label>
            <p className="text-xs text-muted-foreground">Tắt nếu muốn tự dừng sau 20 phút.</p>
          </div>
          <Switch checked={sound.loopForever}
            onCheckedChange={(c) => setSound((p) => ({ ...p, loopForever: c }))} />
        </div>
      </div>
    </Card>
  );
}

function HubSection() {
  const [hub, setHub] = useHubSettings();
  const [pwOpen, setPwOpen] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  async function savePw() {
    if (pw1.length < 4) return toast.error("Mật khẩu cần ≥ 4 ký tự");
    if (pw1 !== pw2) return toast.error("Hai mật khẩu không khớp");
    setBusy(true);
    const hash = await sha256(pw1);
    setHub({ passwordEnabled: true, passwordHash: hash });
    sessionStorage.removeItem("gl_hub_unlocked");
    setBusy(false);
    setPw1(""); setPw2("");
    setPwOpen(false);
    toast.success("Đã lưu mật khẩu");
  }

  function toggle(c: boolean) {
    if (c) {
      // require setting password
      setPwOpen(true);
    } else {
      setHub({ passwordEnabled: false, passwordHash: null });
      sessionStorage.removeItem("gl_hub_unlocked");
      toast.success("Đã tắt mật khẩu Hub");
    }
  }

  return (
    <Card className="max-w-xl border-border/60 p-6">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4" />
        <h3 className="font-display text-lg">Hub password</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Khi bật, mỗi phiên truy cập Hub sẽ cần nhập mật khẩu.
      </p>
      <div className="mt-5 flex items-center justify-between rounded-lg border border-border/60 p-3">
        <div>
          <Label>Bật bảo vệ Hub bằng mật khẩu</Label>
          <p className="text-xs text-muted-foreground">
            {hub.passwordEnabled ? "Đang bật" : "Đang tắt"}
          </p>
        </div>
        <Switch checked={hub.passwordEnabled} onCheckedChange={toggle} />
      </div>
      {hub.passwordEnabled && (
        <Button variant="outline" className="mt-3" onClick={() => setPwOpen(true)}>
          Đổi mật khẩu
        </Button>
      )}

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Đặt mật khẩu Hub</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Mật khẩu mới</Label>
              <Input type="password" className="mt-1" value={pw1} onChange={(e) => setPw1(e.target.value)} />
            </div>
            <div>
              <Label>Nhập lại</Label>
              <Input type="password" className="mt-1" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPwOpen(false)}>Hủy</Button>
            <Button onClick={savePw} disabled={busy}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
