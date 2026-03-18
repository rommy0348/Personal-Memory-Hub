import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Edit2, Check, X, MessageSquare,
  ChevronDown, ChevronRight, FolderOpen, Search
} from "lucide-react";
import { useConversations, ConversationItem } from "@/hooks/use-conversations";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface ConversationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onNewConversation: () => void;
}

function ConvItem({
  conv,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: {
  conv: ConversationItem;
  isActive: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(conv.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitRename = () => {
    if (title.trim() && title !== conv.title) onRename(title.trim());
    setEditing(false);
  };

  return (
    <div
      onClick={() => !editing && onSelect()}
      className={cn(
        "group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
        isActive
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-secondary/60 border border-transparent"
      )}
    >
      <MessageSquare className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditing(false); }}
            onClick={e => e.stopPropagation()}
            className="w-full bg-transparent text-sm text-foreground outline-none border-b border-primary"
          />
        ) : (
          <p className={cn("text-sm truncate", isActive ? "text-primary font-medium" : "text-foreground/80")}>
            {conv.title}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
          {format(new Date(conv.updatedAt), "M月d日 HH:mm", { locale: zhCN })}
        </p>
      </div>

      <div className={cn("flex items-center gap-0.5 shrink-0 transition-opacity", editing ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
        {editing ? (
          <>
            <button onClick={e => { e.stopPropagation(); commitRename(); }} className="p-1 rounded hover:bg-primary/10 text-emerald-500">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={e => { e.stopPropagation(); setEditing(false); setTitle(conv.title); }} className="p-1 rounded hover:bg-secondary text-muted-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={e => { e.stopPropagation(); setEditing(true); }}
              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); if (confirm("删除此对话？")) onDelete(); }}
              className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function ConversationSidebar({
  isOpen, onClose, activeConversationId, onSelectConversation, onNewConversation
}: ConversationSidebarProps) {
  const { conversations, loading, create, rename, remove } = useConversations();
  const { theme } = useApp();
  const [search, setSearch] = useState("");

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  // Group by date
  const today = new Date();
  const todayStr = today.toDateString();
  const yesterdayStr = new Date(today.getTime() - 86400000).toDateString();

  const groups: { label: string; items: ConversationItem[] }[] = [];
  const todayItems = filtered.filter(c => new Date(c.updatedAt).toDateString() === todayStr);
  const yesterdayItems = filtered.filter(c => new Date(c.updatedAt).toDateString() === yesterdayStr);
  const olderItems = filtered.filter(c => {
    const d = new Date(c.updatedAt).toDateString();
    return d !== todayStr && d !== yesterdayStr;
  });
  if (todayItems.length) groups.push({ label: "今天", items: todayItems });
  if (yesterdayItems.length) groups.push({ label: "昨天", items: yesterdayItems });
  if (olderItems.length) groups.push({ label: "更早", items: olderItems });

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col bg-background border-r border-border shadow-2xl"
          >
            {/* Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-border shrink-0">
              <h2 className="font-semibold text-sm text-foreground">历史对话</h2>
              <button
                onClick={onNewConversation}
                className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full border border-primary/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> 新对话
              </button>
            </div>

            {/* Search */}
            <div className="px-3 py-2.5 border-b border-border shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="搜索对话..."
                  className="w-full bg-secondary/40 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              {loading && conversations.length === 0 ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-14 bg-secondary/30 animate-pulse rounded-xl" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground/60">{search ? "未找到对话" : "暂无历史对话"}</p>
                  {!search && (
                    <button
                      onClick={onNewConversation}
                      className="mt-3 text-xs text-primary hover:underline"
                    >
                      开始第一个对话
                    </button>
                  )}
                </div>
              ) : (
                groups.map(group => (
                  <div key={group.label}>
                    <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 mb-1">{group.label}</p>
                    <div className="space-y-0.5">
                      {group.items.map(conv => (
                        <ConvItem
                          key={conv.id}
                          conv={conv}
                          isActive={conv.id === activeConversationId}
                          onSelect={() => { onSelectConversation(conv.id); onClose(); }}
                          onRename={title => rename(conv.id, title)}
                          onDelete={() => remove(conv.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
