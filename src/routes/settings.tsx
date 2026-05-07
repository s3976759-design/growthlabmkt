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
        description="Tài khoản, âm thanh tập trung, mật khẩu Hub." />
      <div className="px-6 py-6 md:px-10">
        <Tabs defaultValue="account">
          <TabsList className="flex-wrap">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="sound">Focus sound</TabsTrigger>
            <TabsTrigger value="hub">Hub</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="mt-6"><AccountSection /></TabsContent>
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
