import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Lightbulb,
  CalendarDays,
  PenLine,
  LineChart,
  Sparkles,
  FlaskConical,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Brain", url: "/brain", icon: Lightbulb, hint: "Ideas & insights" },
  { title: "Plan", url: "/plan", icon: CalendarDays, hint: "Calendar & Kanban" },
  { title: "Execute", url: "/execute", icon: PenLine, hint: "Write content" },
  { title: "Track", url: "/track", icon: LineChart, hint: "Performance" },
  { title: "Review", url: "/review", icon: Sparkles, hint: "Weekly insights" },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-growth-gradient shadow-soft">
            <FlaskConical className="h-5 w-5 text-growth-foreground" strokeWidth={2.4} />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-display text-lg font-semibold tracking-tight">Growth Lab</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Marketing OS
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workflow</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="rounded-lg border border-border/60 bg-surface/60 p-3 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          <p className="font-display text-sm text-foreground">Idea → Insight</p>
          <p className="mt-1 leading-relaxed">
            Đừng làm content mù mờ. Đo, học, lặp lại.
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
