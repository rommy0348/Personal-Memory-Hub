import React from "react";
import { MessageSquare, Brain, Calendar, FolderArchive, Settings } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { ListMemoriesLibraryType } from "@workspace/api-client-react";

export function BottomNav() {
  const { mobileTab, setMobileTab, libraryType, setLibraryType, setSelectedFolderId, setIsPanelOpen } = useApp();
  const [, navigate] = useLocation();

  const switchToLibrary = (lib: ListMemoriesLibraryType) => {
    setLibraryType(lib);
    setMobileTab('panel');
    setIsPanelOpen(true);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl safe-bottom md:hidden">
      <div className="flex items-center h-14">
        <button
          onClick={() => setMobileTab('chat')}
          className={cn("flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-colors", mobileTab === 'chat' ? "text-primary" : "text-muted-foreground")}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-medium">对话</span>
        </button>

        <button
          onClick={() => switchToLibrary('memory')}
          className={cn("flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-colors", mobileTab === 'panel' && libraryType === 'memory' ? "text-primary" : "text-muted-foreground")}
        >
          <Brain className="w-5 h-5" />
          <span className="text-[10px] font-medium">记忆</span>
        </button>

        <button
          onClick={() => switchToLibrary('plan')}
          className={cn("flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-colors", mobileTab === 'panel' && libraryType === 'plan' ? "text-primary" : "text-muted-foreground")}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-medium">计划</span>
        </button>

        <button
          onClick={() => switchToLibrary('material')}
          className={cn("flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-colors", mobileTab === 'panel' && libraryType === 'material' ? "text-primary" : "text-muted-foreground")}
        >
          <FolderArchive className="w-5 h-5" />
          <span className="text-[10px] font-medium">资料</span>
        </button>

        <button
          onClick={() => navigate('/settings')}
          className="flex-1 flex flex-col items-center justify-center h-full gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">设置</span>
        </button>
      </div>
    </nav>
  );
}
