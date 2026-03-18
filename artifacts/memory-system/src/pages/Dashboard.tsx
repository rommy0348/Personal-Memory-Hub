import React from "react";
import { ChatWindow } from "@/components/Chat/ChatWindow";
import { SidePanel } from "@/components/Panel/SidePanel";
import { BottomNav } from "@/components/Layout/BottomNav";
import { useApp } from "@/context/AppContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { mobileTab } = useApp();
  const isMobile = useIsMobile();

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      {/* Desktop: side-by-side. Mobile: show only active tab */}
      <main
        className={cn(
          "flex-1 h-full min-w-0 flex flex-col",
          isMobile && mobileTab !== 'chat' && "hidden"
        )}
      >
        <ChatWindow />
      </main>

      <div
        className={cn(
          isMobile ? "absolute inset-0 top-0 z-30" : "flex h-full",
          isMobile && mobileTab !== 'panel' && "hidden"
        )}
      >
        <SidePanel />
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
