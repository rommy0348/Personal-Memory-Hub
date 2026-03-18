import React, { useState, useRef, useEffect } from "react";
import { Brain, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export type ThinkingMode = "off" | "auto" | "light" | "medium" | "heavy";

interface ThinkingModeButtonProps {
  mode: ThinkingMode;
  budget: number | undefined;
  onChange: (mode: ThinkingMode, budget?: number) => void;
}

const MODES: { id: ThinkingMode; label: string; desc: string; color: string }[] = [
  { id: "off",    label: "关闭思考",  desc: "直接输出，不推理",        color: "text-muted-foreground" },
  { id: "auto",   label: "自动推理",  desc: "模型自主选择推理强度",    color: "text-blue-500" },
  { id: "light",  label: "轻度推理",  desc: "简单分析，快速回答",      color: "text-emerald-500" },
  { id: "medium", label: "中度推理",  desc: "分步思考，清晰结构",      color: "text-amber-500" },
  { id: "heavy",  label: "深度推理",  desc: "全面分析，详细展开",      color: "text-purple-500" },
];

const modeConfig = Object.fromEntries(MODES.map(m => [m.id, m]));

const BADGE_STYLES: Record<ThinkingMode, string> = {
  off:    "text-muted-foreground bg-secondary border-border",
  auto:   "text-blue-500 bg-blue-500/10 border-blue-500/25",
  light:  "text-emerald-500 bg-emerald-500/10 border-emerald-500/25",
  medium: "text-amber-500 bg-amber-500/10 border-amber-500/25",
  heavy:  "text-purple-500 bg-purple-500/10 border-purple-500/25",
};

export function ThinkingModeButton({ mode, budget, onChange }: ThinkingModeButtonProps) {
  const [open, setOpen] = useState(false);
  const [customBudget, setCustomBudget] = useState(budget?.toString() || "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = modeConfig[mode];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className={cn(
          "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all",
          BADGE_STYLES[mode]
        )}
      >
        <Brain className="w-3.5 h-3.5" />
        <span>{mode === "off" ? "思考" : current.label}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute bottom-full left-0 mb-2 w-68 rounded-2xl bg-card border border-border shadow-2xl shadow-black/20 overflow-hidden z-50"
          >
            <div className="p-1">
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => { onChange(m.id, m.id === "heavy" ? (Number(customBudget) || undefined) : undefined); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
                    mode === m.id ? "bg-secondary" : "hover:bg-secondary/60"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full bg-current", m.color)} />
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-medium", mode === m.id ? m.color : "text-foreground")}>{m.label}</div>
                    <div className="text-xs text-muted-foreground">{m.desc}</div>
                  </div>
                  {mode === m.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </button>
              ))}
            </div>

            {/* Custom budget for heavy mode */}
            {mode === "heavy" && (
              <div className="px-4 py-3 border-t border-border bg-secondary/30">
                <label className="block text-xs text-muted-foreground mb-1.5">自定义推理预算 (词数)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={customBudget}
                    onChange={e => setCustomBudget(e.target.value)}
                    placeholder="如 2000"
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
                    onClick={e => e.stopPropagation()}
                  />
                  <button
                    onClick={() => { onChange("heavy", Number(customBudget) || undefined); setOpen(false); }}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium"
                  >
                    应用
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
