"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { CommandPalette } from "./CommandPalette";
import { AICopilotPanel } from "@/components/ai/AICopilotPanel";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading } = useAuth();
  const pathname = usePathname();

  // Special full-screen layout for login / onboarding if needed
  const isAuthPage = pathname === "/login";

  if (isAuthPage) {
    return <main className="min-h-screen bg-bg-main text-txt-primary transition-colors">{children}</main>;
  }

  return (
    <div className="flex h-screen bg-bg-main text-txt-primary overflow-hidden font-sans transition-colors">
      {/* Collapsible Left Sidebar */}
      <Sidebar />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-8 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>

        {/* Mobile Tab Bar */}
        <MobileNav />
      </div>

      {/* Global Interactive Overlays */}
      <CommandPalette />
      <AICopilotPanel />
    </div>
  );
};
