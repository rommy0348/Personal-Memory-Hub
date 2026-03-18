import React from "react";
import { motion } from "framer-motion";
import { X, Copy, Check, Printer } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { useState } from "react";

interface MessageWebViewProps {
  content: string;
  onClose: () => void;
}

export function MessageWebView({ content, onClose }: MessageWebViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative z-10 w-full max-w-2xl max-h-[85vh] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/30 shrink-0">
          <span className="text-sm font-medium text-foreground">网页视图</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-lg border border-border transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "已复制" : "复制"}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-lg border border-border transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              打印
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <MarkdownRenderer content={content} />
        </div>
      </motion.div>
    </div>
  );
}
