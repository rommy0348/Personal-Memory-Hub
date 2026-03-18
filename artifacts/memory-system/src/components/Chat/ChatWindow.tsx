import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Send, Loader2, PanelRightOpen, PanelRightClose,
  BrainCircuit, Sun, Moon, Settings, Menu, Plus
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ConversationSidebar } from "./ConversationSidebar";
import { ThinkingModeButton, ThinkingMode } from "./ThinkingModeButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useConversationMessages } from "@/hooks/use-conversations";
import { useConversations } from "@/hooks/use-conversations";
import { useSendMessage } from "@/hooks/use-send-message";

function UserAvatar({ name, avatarUrl, size = 'sm' }: { name: string; avatarUrl?: string; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  const initials = (name || 'U').slice(0, 1).toUpperCase();
  return avatarUrl ? (
    <img src={avatarUrl} alt={name} className={cn("rounded-full object-cover", sz)} />
  ) : (
    <div className={cn("rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-semibold text-white", sz)}>
      {initials}
    </div>
  );
}

export function ChatWindow() {
  const {
    selectedFolderId, isPanelOpen, togglePanel,
    apiSettings, theme, toggleTheme, userProfile, mobileTab
  } = useApp();
  const isMobile = useIsMobile();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [, navigate] = useLocation();

  // Conversation state
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { load: reloadConversations, branch, starMessage } = useConversations();

  // Thinking mode state
  const [thinkingMode, setThinkingMode] = useState<ThinkingMode>("auto");
  const [thinkingBudget, setThinkingBudget] = useState<number | undefined>(undefined);

  // Selected message (for action bar)
  const [selectedMsgId, setSelectedMsgId] = useState<number | null>(null);

  // Session memories (for highlighting which memories were used)
  const [sessionMemories, setSessionMemories] = useState<Record<number, any[]>>({});

  const { messages, loading } = useConversationMessages(activeConversationId, refreshToken);
  const { send, isPending } = useSendMessage();

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(scrollToBottom, [messages, isPending]);

  const doSend = useCallback(async (msg: string, convId?: number | null) => {
    if (!msg.trim() || isPending) return;

    const result = await send({
      message: msg,
      folderId: selectedFolderId,
      conversationId: convId ?? activeConversationId,
      useMemories: true,
      thinkingMode,
      thinkingBudget,
      apiSettings: apiSettings.enabled ? apiSettings : undefined,
    });

    if (result) {
      if (!activeConversationId && result.conversationId) {
        setActiveConversationId(result.conversationId);
      }
      if (result.usedMemories?.length > 0 && result.messageId) {
        setSessionMemories(prev => ({ ...prev, [result.messageId]: result.usedMemories }));
      }
      setRefreshToken(t => t + 1);
      reloadConversations();
    }
  }, [isPending, send, selectedFolderId, activeConversationId, thinkingMode, thinkingBudget, apiSettings, reloadConversations]);

  const handleSend = () => {
    if (!input.trim()) return;
    doSend(input);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && userProfile.sendOnEnter) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setRefreshToken(t => t + 1);
    setSelectedMsgId(null);
    setSessionMemories({});
    setSidebarOpen(false);
  };

  const handleSelectConversation = (id: number) => {
    setActiveConversationId(id);
    setRefreshToken(t => t + 1);
    setSelectedMsgId(null);
    setSessionMemories({});
  };

  const handleRefresh = useCallback(async (msgIndex: number) => {
    // Find the user message before this AI message
    const msgs = messages;
    let userMsg = "";
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (msgs[i].role === "user") { userMsg = msgs[i].content; break; }
    }
    if (!userMsg) return;
    await doSend(userMsg);
  }, [messages, doSend]);

  const handleBranch = useCallback(async (msgId: number) => {
    if (!activeConversationId) return;
    const branchedConv = await branch(activeConversationId, msgId, "分支对话");
    if (branchedConv) {
      setActiveConversationId(branchedConv.id);
      setRefreshToken(t => t + 1);
      setSelectedMsgId(null);
    }
  }, [activeConversationId, branch]);

  const handleStar = useCallback(async (msgId: number, isStarred: boolean) => {
    await starMessage(msgId, isStarred);
    setRefreshToken(t => t + 1);
  }, [starMessage]);

  const handleEdit = useCallback(async (msgIndex: number, newContent: string) => {
    await doSend(newContent);
  }, [doSend]);

  const hasMessages = messages.length > 0;
  const isNewChat = !activeConversationId && !hasMessages;

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Conversation sidebar */}
      <ConversationSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />

      {/* ── Header ── */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background/80 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          {/* Hamburger to open history sidebar */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            title="对话历史"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20">
            <BrainCircuit className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">AI 记忆助手</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-muted-foreground">
                {apiSettings.enabled ? apiSettings.model : "Replit AI"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          {/* New conversation */}
          <Button
            variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleNewConversation}
            title="新对话"
          >
            <Plus className="h-4 w-4" />
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
            title={theme === 'dark' ? '切换日间模式' : '切换深色模式'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Settings/Avatar */}
          <Button
            variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/settings')}
            title="账号设置"
          >
            <UserAvatar name={userProfile.name} avatarUrl={userProfile.avatarUrl} />
          </Button>

          {/* Panel toggle (desktop only) */}
          {!isMobile && (
            <Button
              variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={togglePanel}
              title={isPanelOpen ? "收起记忆面板" : "展开记忆面板"}
            >
              {isPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </header>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth"
        onClick={() => setSelectedMsgId(null)}
      >
        {loading && !hasMessages ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
          </div>
        ) : isNewChat ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-600/20 border border-purple-500/20 flex items-center justify-center mb-5 shadow-xl shadow-purple-500/10">
              <BrainCircuit className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              你好，{userProfile.name || '朋友'} 👋
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              和我对话，我会调用你的记忆库为你提供个性化回答，并自动整理对话内容。
            </p>
            <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
              {[
                "总结我最近的工作记录",
                "我有哪些待处理的计划？",
                "帮我整理一下相关笔记",
                "分析我的情感状态趋势",
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={e => { e.stopPropagation(); setInput(suggestion); textareaRef.current?.focus(); }}
                  className="text-left text-sm text-muted-foreground hover:text-foreground bg-secondary/40 hover:bg-secondary border border-border hover:border-border/80 px-4 py-3 rounded-xl transition-all leading-snug"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 pb-4">
            {messages.map((msg, idx) => (
              <ChatMessageBubble
                key={msg.id || `tmp-${idx}`}
                message={msg}
                usedMemories={msg.id ? sessionMemories[msg.id] : undefined}
                isSelected={selectedMsgId === (msg.id ?? idx)}
                onSelect={() => {
                  setSelectedMsgId(prev => prev === (msg.id ?? idx) ? null : (msg.id ?? idx));
                }}
                onRefresh={msg.role === "assistant" ? () => handleRefresh(idx) : undefined}
                onBranch={msg.id ? () => handleBranch(msg.id!) : undefined}
                onStar={msg.id ? (isStarred) => handleStar(msg.id!, isStarred) : undefined}
                onEdit={msg.role === "user" ? (newContent) => handleEdit(idx, newContent) : undefined}
              />
            ))}
            {isPending && (
              <div className="flex gap-3 mb-8">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-md">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400/70 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-purple-400/70 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-purple-400/70 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <div className={cn("px-4 pt-2 shrink-0", isMobile ? "pb-16" : "pb-5")}>
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl border border-border bg-card hover:border-border/80 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-lg">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={`给 AI 发消息... (${userProfile.sendOnEnter ? 'Enter' : 'Ctrl+Enter'} 发送)`}
              className="w-full bg-transparent border-none text-foreground placeholder:text-muted-foreground/50 focus:ring-0 resize-none min-h-[52px] max-h-[200px] py-4 px-4 text-[15px] leading-relaxed"
              rows={1}
              style={{ outline: "none" }}
            />
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-2">
                <ThinkingModeButton
                  mode={thinkingMode}
                  budget={thinkingBudget}
                  onChange={(m, b) => { setThinkingMode(m); setThinkingBudget(b); }}
                />
                {apiSettings.enabled && (
                  <span className="text-xs text-primary/60 bg-primary/8 px-2.5 py-1 rounded-full border border-primary/15">
                    {apiSettings.model}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground/40 hidden sm:block">
                  {input.length > 0 ? `${input.length} 字` : ''}
                </span>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isPending}
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                    input.trim() && !isPending
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/25"
                      : "bg-secondary text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-center text-[11px] text-muted-foreground/35 mt-2">
            AI 会调用相关记忆来个性化回答 · 对话内容自动保存
          </p>
        </div>
      </div>
    </div>
  );
}
