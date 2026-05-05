import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAccount } from "@/lib/settings";

const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

function greeting(h: number) {
  if (h < 5) return "Khuya rồi";
  if (h < 11) return "Good morning";
  if (h < 14) return "Good noon";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function DateTimeWidget() {
  const [now, setNow] = useState(() => new Date());
  const [account] = useAccount();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${monthVi(now.getMonth())} ${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const hello = `${greeting(now.getHours())}, ${account.displayName || "bạn"}`;

  return (
    <Card className="border-border/60 bg-card/80 p-5 shadow-soft backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Hôm nay
      </p>
      <p className="mt-2 font-display text-2xl font-semibold leading-tight">{dateStr}</p>
      <p className="mt-1 font-display text-4xl font-semibold tabular-nums tracking-tight text-foreground">
        {timeStr}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{hello} ✦</p>
    </Card>
  );
}

function monthVi(m: number) {
  return ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"][m];
}
