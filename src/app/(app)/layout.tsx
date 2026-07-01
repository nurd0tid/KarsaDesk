"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatusBar } from "@/components/layout/StatusBar";
import { TaskDrawer } from "@/features/tasks/components/TaskDrawer";
import { CommandPalette } from "@/components/layout/CommandPalette";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWorkspace = pathname === "/workspace" || pathname.startsWith("/workspace/");

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className={`flex flex-1 flex-col min-w-0 ${isWorkspace ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {children}
        </main>
      </div>
      {!isWorkspace && <StatusBar />}
      <TaskDrawer />
      <CommandPalette />
    </div>
  );
}
