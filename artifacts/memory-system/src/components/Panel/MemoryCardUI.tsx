import React, { useState } from "react";
import { Star, Clock } from "lucide-react";
import { MemoryCard as MemoryCardType } from "@workspace/api-client-react";
import { cn, formatDate } from "@/lib/utils";
import { MemoryDetailModal } from "../Modals/MemoryDetailModal";

interface MemoryCardUIProps {
  memory: MemoryCardType;
}

const EMOTION_CONFIG: Record<string, { label: string; dot: string; bar: string; badge: string }> = {
  calm:     { label: "平静", dot: "🔵", bar: "from-blue-500 to-cyan-500",     badge: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20" },
  excited:  { label: "激动", dot: "🔴", bar: "from-red-500 to-orange-500",    badge: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20" },
  positive: { label: "积极", dot: "🟢", bar: "from-emerald-500 to-green-500", badge: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  negative: { label: "消极", dot: "🟠", bar: "from-orange-500 to-amber-500",  badge: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20" },
  neutral:  { label: "中性", dot: "⚪", bar: "from-gray-400 to-slate-400",    badge: "text-muted-foreground bg-secondary border-border" },
};

export function MemoryCardUI({ memory }: MemoryCardUIProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const emotion = EMOTION_CONFIG[memory.emotionLabel] || EMOTION_CONFIG.neutral;
  const weight = memory.emotionWeight || 0.5;

  return (
    <>
      <div
        onClick={() => setIsDetailOpen(true)}
        className="group relative bg-card hover:bg-secondary/50 border border-border hover:border-border/80 rounded-xl p-3.5 cursor-pointer transition-all overflow-hidden"
      >
        <div
          className={cn("absolute top-0 left-0 h-0.5 bg-gradient-to-r", emotion.bar)}
          style={{ width: `${weight * 100}%` }}
        />
        {memory.isImportant && (
          <Star className="absolute top-3 right-3 w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
        )}
        <h3 className="text-sm font-medium text-foreground group-hover:text-foreground/90 line-clamp-1 mb-1.5 pr-5 transition-colors">
          {memory.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
          {memory.content}
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-[11px] px-2 py-0.5 rounded-full border font-medium shrink-0", emotion.badge)}>
            {emotion.dot} {emotion.label}
          </span>
          <span className="text-[11px] text-muted-foreground/60 shrink-0">{formatDate(memory.updatedAt)}</span>
        </div>
        {memory.keywords && memory.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5 pt-2.5 border-t border-border/50">
            {(memory.keywords as string[]).slice(0, 4).map((kw, i) => (
              <span key={i} className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-md border border-border/50">
                #{kw}
              </span>
            ))}
            {memory.keywords.length > 4 && (
              <span className="text-[10px] text-muted-foreground/50">+{memory.keywords.length - 4}</span>
            )}
          </div>
        )}
      </div>
      <MemoryDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} memory={memory} />
    </>
  );
}
