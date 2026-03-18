import React, { useState, useRef, useCallback } from "react";
import { Search, Plus, Library, Brain, Calendar, FolderArchive,
  ChevronLeft, ChevronRight, PanelRightClose, ArrowLeft } from "lucide-react";
import { useListFolders, useListMemories, ListMemoriesLibraryType } from "@workspace/api-client-react";
import { useApp } from "@/context/AppContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FolderTree } from "./FolderTree";
import { MemoryCardUI } from "./MemoryCardUI";
import { CreateMemoryModal } from "../Modals/CreateMemoryModal";

export function SidePanel() {
  const {
    isPanelOpen, togglePanel, setIsPanelOpen,
    libraryType, setLibraryType,
    selectedFolderId, searchQuery, setSearchQuery, setSelectedFolderId,
    sidebarWidth, setSidebarWidth,
    mobileTab, setMobileTab,
  } = useApp();
  const isMobile = useIsMobile();

  const [isCreateMemoryOpen, setIsCreateMemoryOpen] = useState(false);
  const [isFolderCollapsed, setIsFolderCollapsed] = useState(false);

  // Drag-to-resize state
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(sidebarWidth);

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    dragStartX.current = clientX;
    dragStartWidth.current = sidebarWidth;

    const onMove = (ev: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const cx = 'touches' in ev ? (ev as TouchEvent).touches[0].clientX : (ev as MouseEvent).clientX;
      const delta = dragStartX.current - cx;
      const newW = Math.max(280, Math.min(640, dragStartWidth.current + delta));
      setSidebarWidth(newW);
    };

    const onUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };

    document.addEventListener('mousemove', onMove, { passive: false });
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  }, [sidebarWidth, setSidebarWidth]);

  const { data: folders = [] } = useListFolders();
  const { data: memories = [], isLoading: memoriesLoading } = useListMemories({
    folderId: selectedFolderId || undefined,
    libraryType,
    search: searchQuery || undefined,
  });

  const tabs: { id: ListMemoriesLibraryType; label: string; icon: React.ReactNode }[] = [
    { id: 'memory', label: '记忆库', icon: <Brain className="w-3.5 h-3.5" /> },
    { id: 'plan', label: '计划库', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'material', label: '资料库', icon: <FolderArchive className="w-3.5 h-3.5" /> },
  ];

  // On mobile: always render; on desktop: only when open
  if (!isMobile && !isPanelOpen) return null;

  const panelWidth = isMobile ? '100%' : sidebarWidth;

  return (
    <div
      className="relative flex h-full shrink-0 select-none border-l border-border bg-background"
      style={{ width: panelWidth }}
    >
      {/* ── Drag Handle (desktop only) ── */}
      {!isMobile && (
        <div
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          className="resize-handle absolute left-0 top-0 bottom-0 w-1 z-20 hover:bg-primary/40 active:bg-primary/60 transition-colors group"
          title="拖拽调整宽度"
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-12 rounded-full bg-border group-hover:bg-primary/50 transition-colors" />
        </div>
      )}

      <div className="flex flex-col h-full w-full min-w-0">
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center px-3 gap-2 shrink-0">
          {/* Mobile back button */}
          {isMobile && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setMobileTab('chat')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索记忆..."
              className="pl-9 h-8 bg-secondary/50 border-border text-sm"
            />
          </div>
          {/* Desktop close button */}
          {!isMobile && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" onClick={togglePanel}>
              <PanelRightClose className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Library tabs */}
        <div className="px-3 py-2.5 border-b border-border shrink-0">
          <div className="flex bg-secondary/60 p-1 rounded-xl gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setLibraryType(tab.id); setSelectedFolderId(null); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all",
                  libraryType === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body: Folder + Cards */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Folder column */}
          {!isFolderCollapsed && (
            <div className="w-[130px] shrink-0 border-r border-border bg-secondary/20 overflow-hidden">
              <FolderTree folders={folders.filter(f => f.libraryType === libraryType)} />
            </div>
          )}

          {/* Cards column */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Cards header bar */}
            <div className="px-2.5 py-2 border-b border-border flex items-center justify-between shrink-0">
              <button
                onClick={() => setIsFolderCollapsed(p => !p)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-secondary/40 hover:bg-secondary px-2 py-1 rounded-lg transition-all border border-border/60"
              >
                {isFolderCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                {isFolderCollapsed ? '目录' : '收起'}
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{memories.length} 条</span>
                <Button size="icon" className="h-6 w-6 rounded-lg" onClick={() => setIsCreateMemoryOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Cards list */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {memoriesLoading ? (
                <>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-secondary/30 animate-pulse rounded-xl" />
                  ))}
                </>
              ) : memories.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <Library className="w-8 h-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground/60 mb-3">暂无记录</p>
                  <Button variant="ghost" size="sm" className="text-primary text-xs h-7" onClick={() => setIsCreateMemoryOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> 新建记录
                  </Button>
                </div>
              ) : (
                memories.map(memory => <MemoryCardUI key={memory.id} memory={memory} />)
              )}
            </div>
          </div>
        </div>
      </div>

      <CreateMemoryModal
        isOpen={isCreateMemoryOpen}
        onClose={() => setIsCreateMemoryOpen(false)}
        defaultFolderId={selectedFolderId || undefined}
        libraryType={libraryType}
      />
    </div>
  );
}
