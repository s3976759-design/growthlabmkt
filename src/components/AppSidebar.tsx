import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Lightbulb,
  CalendarDays,
  PenLine,
  LineChart,
  Sparkles,
  FlaskConical,
  FolderOpen,
  Wand2,
  Workflow,
  Settings as SettingsIcon,
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
import { useT, type DictKey } from "@/lib/i18n";

const items: { key: DictKey; url: string; icon: typeof LayoutDashboard }[] = [
  { key: "nav.dashboard", url: "/", icon: LayoutDashboard },
  { key: "nav.brain", url: "/brain", icon: Lightbulb },
  { key: "nav.plan", url: "/plan", icon: CalendarDays },
  { key: "nav.execute", url: "/execute", icon: PenLine },
  { key: "nav.pipeline", url: "/pipeline", icon: Workflow },
  { key: "nav.aiwriter", url: "/ai-writer", icon: Wand2 },
  { key: "nav.track", url: "/track", icon: LineChart },
  { key: "nav.review", url: "/review", icon: Sparkles },
  { key: "nav.hub", url: "/hub", icon: FolderOpen },
  { key: "nav.settings", url: "/settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const t = useT();

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
          <SidebarGroupLabel>{t("sidebar.workflow")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;
                const label = t(item.key);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={label}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{label}</span>
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
          <p className="mt-1 leading-relaxed">{t("sidebar.tagline")}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
