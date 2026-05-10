import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useT } from "@/lib/i18n";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlanTable } from "@/components/planner/PlanTable";
import { PlanCalendar } from "@/components/planner/PlanCalendar";
import { PlanTasks } from "@/components/planner/PlanTasks";
import { PlanOverview } from "@/components/planner/PlanOverview";
import { PlanSettings } from "@/components/planner/PlanSettings";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Content Plan — Growth Lab" },
      { name: "description", content: "Full content planner: plan, calendar, tasks, overview." },
    ],
  }),
  component: PlanPage,
});

const TABS = [
  { v: "plan", label: "Plan" },
  { v: "calendar", label: "Calendar" },
  { v: "tasks", label: "Tasks" },
  { v: "overview", label: "Overview" },
  { v: "archive", label: "Archive" },
  { v: "settings", label: "Settings" },
];

function PlanPage() {
  const t = useT();
  const [tab, setTab] = useState("plan");
  return (
    <div>
      <PageHeader
        eyebrow={t("plan.eyebrow")}
        title={t("plan.title")}
        description={t("plan.desc")}
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
          <TabsContent value="plan"><PlanTable mode="active" /></TabsContent>
          <TabsContent value="calendar"><PlanCalendar /></TabsContent>
          <TabsContent value="tasks"><PlanTasks /></TabsContent>
          <TabsContent value="overview"><PlanOverview /></TabsContent>
          <TabsContent value="archive"><PlanTable mode="archive" /></TabsContent>
          <TabsContent value="settings"><PlanSettings /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
