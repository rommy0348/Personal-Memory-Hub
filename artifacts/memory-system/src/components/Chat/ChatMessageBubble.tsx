import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit, ChevronDown, ChevronUp, Copy, Check, RefreshCw,
  MoreHorizontal, Globe, GitBranch, Star, StarOff, Edit2, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { MessageWebView } from "./MessageWebView";
import { useApp } from "@/context/AppContext";
import { format } from "date-fns";

export interface MessageData {
  id?: number;
  role: string;
  content: string;
  isStarred?: boolean;
  createdAt?: string;
}

interface ChatMessageBubbleProps {
  message: MessageData;
  usedMemories?: any[];
  isSelected?: boolean;
  onSelect?: () => void;
  onRefresh?: () => void;
  onBranch?: () => void;
  onStar?: (isStarred: boolean) => void;
  onEdit?: (newContent: string) => void;
}

function ActionBar({
  isAI, isStarred, onCopy, onRefresh, onBranch, onStar, onWebView, onEdit, visible
}: {
  isAI: boolean; isStarred?: boolean; onCopy: () => void;
  onRefresh?: () => void; onBranch?: () => void;
  onStar?: (v: boolean) => void; onWebView?: () => void;
  onEdit?: () => void; visible: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCopy = () => { onCopy(); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          className={cn("flex items-center gap-1 mt-2", !isAI && "justify-end")}
        >
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-secondary/60 hover:bg-secondary px-2.5 py-1.5 rounded-lg border border-border/60 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "已复制" : "复制"}
          </button>

          {isAI && onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-secondary/60 hover:bg-secondary px-2.5 py-1.5 rounded-lg border border-border/60 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              重新生成
            </button>
          )}

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(p => !p)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground bg-secondary/60 hover:bg-secondary border border-border/60 transition-all"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className={cn(
                      "absolute z-20 mt-1 w-40 bg-card border border-border rounded-xl shadow-xl overflow-hidden",
                      isAI ? "left-0" : "right-0"
                    )}
                  >
                    {onWebView && (
                      <MenuBtn icon={<Globe className="w-3.5 h-3.5" />} label="网页视图" onClick={() => { onWebView(); setMenuOpen(false); }} />
                    )}
                    {onBranch && (
                      <MenuBtn icon={<GitBranch className="w-3.5 h-3.5" />} label="从此处分支" onClick={() => { onBranch(); setMenuOpen(false); }} />
                    )}
                    {!isAI && onEdit && (
                      <MenuBtn icon={<Edit2 className="w-3.5 h-3.5" />} label="编辑消息" onClick={() => { onEdit(); setMenuOpen(false); }} />
                    )}
                    {onStar && (
                      <MenuBtn
                        icon={isStarred ? <StarOff className="w-3.5 h-3.5 text-amber-500" /> : <Star className="w-3.5 h-3.5" />}
                        label={isStarred ? "取消收藏" : "收藏"}
                        onClick={() => { onStar(!isStarred); setMenuOpen(false); }}
                      />
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MenuBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground/80 hover:text-foreground hover:bg-secondary transition-colors text-left"
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </button>
  );
}

export function ChatMessageBubble({
  message,
  usedMemories,
  isSelected,
  onSelect,
  onRefresh,
  onBranch,
  onStar,
  onEdit,
}: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  const isAI = !isUser;
  const [showMemories, setShowMemories] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const { userProfile } = useApp();

  const timeStr = message.createdAt ? format(new Date(message.createdAt), "HH:mm") : "";

  const handleCopy = () => navigator.clipboard.writeText(message.content);

  if (isUser) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex w-full mb-6 justify-end">
        <div
          className="flex flex-col items-end max-w-[75%] cursor-pointer"
          onClick={e => { e.stopPropagation(); onSelect?.(); }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] text-muted-foreground">{timeStr}</span>
            <span className="text-sm font-medium text-foreground">{userProfile.name || '你'}</span>
          </div>

          {editing ? (
            <div className="w-full">
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                className="w-full bg-secondary/60 border border-primary/40 rounded-2xl px-5 py-3.5 text-foreground text-[15px] leading-[1.7] focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 justify-end mt-2">
                <button onClick={() => { setEditing(false); setEditText(message.content); }} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg bg-secondary border border-border">取消</button>
                <button onClick={() => { onEdit?.(editText); setEditing(false); }} className="text-xs text-primary-foreground px-3 py-1.5 rounded-lg bg-primary">保存并重发</button>
              </div>
            </div>
          ) : (
            <div className={cn(
              "bg-primary text-primary-foreground px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-md shadow-primary/20 text-[15px] leading-[1.7] whitespace-pre-wrap transition-opacity",
              message.isStarred && "ring-1 ring-amber-400/50"
            )}>
              {message.content}
              {message.isStarred && <span className="ml-2 text-amber-400 text-xs">⭐</span>}
            </div>
          )}

          <ActionBar
            isAI={false}
            isStarred={message.isStarred}
            visible={!!isSelected && !editing}
            onCopy={handleCopy}
            onBranch={onBranch}
            onStar={onStar}
            onEdit={() => setEditing(true)}
          />
        </div>
      </motion.div>
    );
  }

  // AI message
  return (
    <>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex w-full mb-6 justify-start">
        <div className="flex gap-3 max-w-[90%] min-w-0">
          {/* AI Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-md shadow-purple-500/20">
            <span className="text-white text-xs font-bold">AI</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-foreground">AI 记忆助手</span>
              <span className="text-[11px] text-muted-foreground">{timeStr}</span>
              {message.isStarred && <span className="text-amber-400 text-xs">⭐</span>}
            </div>

            {/* AI bubble card */}
            <div
              onClick={e => { e.stopPropagation(); onSelect?.(); }}
              className={cn(
                "rounded-2xl rounded-tl-sm border p-5 cursor-pointer transition-all",
                isSelected
                  ? "border-primary/30 bg-primary/5 shadow-sm"
                  : "border-border/60 bg-card/50 hover:border-border hover:bg-card/80"
              )}
            >
              <MarkdownRenderer content={message.content} />
            </div>

            {/* Action bar */}
            <ActionBar
              isAI
              isStarred={message.isStarred}
              visible={!!isSelected}
              onCopy={handleCopy}
              onRefresh={onRefresh}
              onBranch={onBranch}
              onStar={onStar}
              onWebView={() => setShowWebView(true)}
            />

            {/* Used memories */}
            {usedMemories && usedMemories.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setShowMemories(!showMemories)}
                  className="flex items-center gap-1.5 text-xs text-primary bg-primary/8 hover:bg-primary/15 transition-colors px-3 py-1.5 rounded-full border border-primary/20"
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  调用了 {usedMemories.length} 条相关记忆
                  {showMemories ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                </button>

                <AnimatePresence>
                  {showMemories && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="flex flex-col gap-2 overflow-hidden"
                    >
                      {usedMemories.map((memory: any, i: number) => (
                        <div key={memory.id || i} className="bg-secondary/40 border border-border rounded-xl p-3 text-xs">
                          <div className="font-semibold text-foreground mb-1 line-clamp-1">{memory.title}</div>
                          <div className="text-muted-foreground line-clamp-2">{memory.content}</div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showWebView && (
          <MessageWebView content={message.content} onClose={() => setShowWebView(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
