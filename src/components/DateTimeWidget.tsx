import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAccount } from "@/lib/settings";
import { useT, useLanguage } from "@/lib/i18n";

export function DateTimeWidget() {
  const [now, setNow] = useState(() => new Date());
  const [account] = useAccount();
  const t = useT();
  const [lang] = useLanguage();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const locale = lang === "zh" ? "zh-CN" : "en-US";
  const dateStr = now.toLocaleDateString(locale, {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
  const hello = `${t("greeting.hello")}, ${account.displayName || "friend"}`;

  return (
    <Card className="border-border/60 bg-card/80 p-5 shadow-soft backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {t("dash.today")}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold leading-tight">{dateStr}</p>
      <p className="mt-1 font-display text-4xl font-semibold tabular-nums tracking-tight text-foreground">
        {timeStr}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{hello} ✦</p>
    </Card>
  );
}
