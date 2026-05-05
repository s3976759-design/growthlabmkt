import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { DashboardBackground } from "@/components/DashboardBackground";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-semibold text-foreground">404</h1>
        <h2 className="mt-4 font-display text-xl text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Trang này không tồn tại trong lab.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Về Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Growth Lab — Personal Marketing OS" },
      { name: "description", content: "Biến ý tưởng thành content, đo hiệu quả, rút insight, làm tốt hơn." },
      { property: "og:title", content: "Growth Lab" },
      { property: "og:description", content: "Personal marketing operating system. Idea → Content → Insight." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const tabLabels: Record<string, string> = {
  "/": "Dashboard",
  "/brain": "Content Brain",
  "/plan": "Content Planner",
  "/execute": "Content Execution",
  "/ai-writer": "AI Draft Writer",
  "/track": "Performance Tracker",
  "/review": "Weekly Review",
  "/hub": "Document Hub",
  "/settings": "Settings",
};

function TopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const label = tabLabels[pathname] ?? "Growth Lab";
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger className="-ml-1" />
      <div className="h-5 w-px bg-border" />
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Growth Lab
        </span>
        <span className="text-muted-foreground/50">/</span>
        <span className="font-display text-sm font-medium">{label}</span>
      </div>
    </header>
  );
}

function RootComponent() {
  return (
    <SidebarProvider>
      <DashboardBackground />
      <div className="relative flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <TopBar />
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
