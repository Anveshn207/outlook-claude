"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { PageTransition } from "@/components/shared/motion";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/candidates": "Candidates",
  "/jobs": "Jobs",
  "/clients": "Clients",
  "/pipeline": "Pipeline",
  "/interviews": "Interviews",
  "/tasks": "Tasks",
  "/reports": "Reports",
  "/team": "Team",
  "/notifications": "Notifications",
  "/search": "Search",
  "/import": "Import Data",
  "/settings": "Settings",
  "/account": "My Account",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const title =
    pageTitles[pathname] ||
    Object.entries(pageTitles).find(([key]) =>
      pathname.startsWith(key),
    )?.[1] ||
    "KurweBall";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area offset by sidebar width on desktop */}
      <div className="flex flex-1 flex-col min-w-0 lg:pl-64">
        <Navbar title={title} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <PageTransition key={pathname}>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
