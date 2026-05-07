import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useT } from "@/lib/i18n";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlanTable } from "@/components/planner/PlanTable";
import { PlanCalendar } from "@/components/planner/PlanCalendar";
import { PlanTasks } from "@/components/planner/PlanTasks";
import { PlanOverview } from "@/components/planner/PlanOverview";
import { PlanSample } from "@/components/planner/PlanSample";
import { PlanSettings } from "@/components/planner/PlanSettings";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Content Plan — Growth Lab" },
      { name: "description", content: "Content planner đầy đủ: kế hoạch, lịch, công việc, tổng quan, ý tưởng." },
    ],
  }),
  component: PlanPage,
});

const TABS = [
  { v: "ke-hoach", label: "Kế hoạch" },
  { v: "lich", label: "Lịch" },
  { v: "cong-viec", label: "Bảng công việc" },
  { v: "tong-quan", label: "Tổng quan" },
  { v: "luu-tru", label: "Lưu trữ" },
  { v: "sample", label: "Sample" },
  { v: "thiet-lap", label: "Thiết lập" },
];

function PlanPage() {
  const [tab, setTab] = useState("ke-hoach");
  return (
    <div>
      <PageHeader
        eyebrow="Content Planner"
        title="Toàn bộ workflow content, một file duy nhất."
        description="Kế hoạch · Lịch · Công việc · Tổng quan · Ý tưởng · Lưu trữ · Pillars · Sample · Thiết lập."
      />
      <div className="px-6 py-6 md:px-10">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-5 flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.v}
                value={t.v}
                className="rounded-md border border-border/60 bg-card px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="ke-hoach"><PlanTable mode="active" /></TabsContent>
          <TabsContent value="lich"><PlanCalendar /></TabsContent>
          <TabsContent value="cong-viec"><PlanTasks /></TabsContent>
          <TabsContent value="tong-quan"><PlanOverview /></TabsContent>
          <TabsContent value="luu-tru"><PlanTable mode="archive" /></TabsContent>
          <TabsContent value="sample"><PlanSample /></TabsContent>
          <TabsContent value="thiet-lap"><PlanSettings /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
