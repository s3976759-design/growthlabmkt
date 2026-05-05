import { useEffect, useState } from "react";
import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import {
  SOUNDS,
  getFocusState,
  playFocusSound,
  setFocusVolume,
  stopFocusSound,
  subscribeFocus,
} from "@/lib/focusSound";
import { useSoundSettings } from "@/lib/settings";

export function FocusMiniPlayer() {
  const [sound, setSound] = useSoundSettings();
  const [, force] = useState(0);
  useEffect(() => {
    const unsub = subscribeFocus(() => force((n) => n + 1));
    return () => { unsub; };
  }, []);

  const state = getFocusState();
  const active = SOUNDS.find((s) => s.id === sound.selectedId) ?? SOUNDS[0];

  const onToggle = () => {
    if (state.isPlaying) stopFocusSound();
    else playFocusSound(sound.selectedId ?? active.id, sound.volume);
  };

  return (
    <Card className="border-border/60 bg-card/80 p-4 shadow-soft backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Focus sound
          </p>
          <p className="mt-1 font-display text-sm">
            {active.emoji} {active.label}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={onToggle} className="h-8 w-8">
            {state.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          {state.isPlaying && (
            <Button size="icon" variant="ghost" onClick={stopFocusSound} className="h-8 w-8">
              <Square className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {SOUNDS.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setSound((p) => ({ ...p, selectedId: s.id }));
              if (state.isPlaying) playFocusSound(s.id, sound.volume);
            }}
            className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
              s.id === active.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Vol</span>
        <Slider
          value={[sound.volume]}
          onValueChange={([v]) => {
            setSound((p) => ({ ...p, volume: v }));
            setFocusVolume(v);
          }}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="w-8 text-right text-[11px] tabular-nums text-muted-foreground">
          {sound.volume}
        </span>
      </div>
    </Card>
  );
}
