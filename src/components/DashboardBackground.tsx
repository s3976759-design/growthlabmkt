import { useBackground } from "@/lib/settings";
import { getBackground } from "@/lib/backgrounds";

const overlayBg: Record<string, string> = {
  light: "rgba(255,255,255,",
  dark: "rgba(20,18,15,",
  cream: "rgba(252,243,228,",
  none: "rgba(0,0,0,0",
};

export function DashboardBackground() {
  const [bg] = useBackground();
  const opt = getBackground(bg.id);
  if (!opt.src) return null;

  const alpha = bg.overlay === "none" ? 0 : Math.max(0, Math.min(1, bg.overlayStrength / 100));
  const overlay = bg.overlay === "none" ? "transparent" : `${overlayBg[bg.overlay]}${alpha})`;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <img
        src={opt.src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: `blur(${bg.blur}px)`, transform: bg.blur ? "scale(1.05)" : undefined }}
      />
      {opt.animated && (
        <div className="absolute inset-0 mix-blend-screen opacity-40 animate-[drift_40s_linear_infinite] bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.5),transparent_40%),radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.4),transparent_45%)]" />
      )}
      <div className="absolute inset-0" style={{ backgroundColor: overlay }} />
    </div>
  );
}
