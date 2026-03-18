import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "calm" | "excited" | "positive" | "negative" | "neutral";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-primary/20 text-primary border-transparent",
    outline: "border-white/20 text-foreground",
    calm: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    excited: "bg-red-500/15 text-red-400 border-red-500/20",
    positive: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    negative: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    neutral: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
