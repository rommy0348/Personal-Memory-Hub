import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, AlertTriangle, Info, Lightbulb, AlertCircle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-secondary/60 hover:bg-secondary px-2.5 py-1 rounded-md transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "已复制" : "复制"}
    </button>
  );
}

type CalloutType = "note" | "tip" | "warning" | "important" | "caution";

const CALLOUT_CONFIGS: Record<CalloutType, { icon: React.FC<any>; label: string; border: string; bg: string; iconColor: string }> = {
  note:      { icon: Info,          label: "备注",  border: "border-blue-500/40",   bg: "bg-blue-500/8",    iconColor: "text-blue-500" },
  tip:       { icon: Lightbulb,     label: "提示",  border: "border-emerald-500/40",bg: "bg-emerald-500/8", iconColor: "text-emerald-500" },
  warning:   { icon: AlertTriangle, label: "警告",  border: "border-amber-500/40",  bg: "bg-amber-500/8",   iconColor: "text-amber-500" },
  important: { icon: AlertCircle,   label: "重要",  border: "border-purple-500/40", bg: "bg-purple-500/8",  iconColor: "text-purple-500" },
  caution:   { icon: Flame,         label: "注意",  border: "border-red-500/40",    bg: "bg-red-500/8",     iconColor: "text-red-500" },
};

function detectCallout(children: React.ReactNode): { type: CalloutType; text: React.ReactNode } | null {
  const childArr = React.Children.toArray(children);
  const firstChild = childArr[0];
  if (!firstChild) return null;
  if (typeof firstChild !== 'object' || !('props' in (firstChild as any))) return null;
  const pChildren = (firstChild as any).props?.children;
  const pArr = React.Children.toArray(pChildren);
  const firstText = pArr[0];
  if (typeof firstText !== 'string') return null;
  const match = firstText.match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*/i);
  if (!match) return null;
  const type = match[1].toLowerCase() as CalloutType;
  const rest = firstText.slice(match[0].length);
  const newFirstP = rest || pArr.slice(1);
  const restChildren = childArr.slice(1);
  return { type, text: <>{rest}{pArr.slice(1)}{restChildren}</> };
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  return (
    <div className={cn("markdown-body text-[15px]", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className: cls, children, ...props }) {
            const match = /language-(\w+)/.exec(cls || "");
            const text = String(children).replace(/\n$/, "");
            const isInline = !match && !text.includes("\n");
            if (isInline) {
              return (
                <code className="bg-secondary text-primary px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-border/60" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <div className="relative my-4 rounded-xl overflow-hidden border border-border shadow-sm">
                <div className="flex items-center justify-between px-4 py-2 bg-secondary/80 border-b border-border">
                  <span className="text-xs text-muted-foreground font-mono">{match?.[1] || "text"}</span>
                  <CopyButton text={text} />
                </div>
                <SyntaxHighlighter
                  style={isDark ? oneDark : oneLight}
                  language={match?.[1] || "text"}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    padding: "1rem",
                    background: isDark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.03)",
                    fontSize: "13px",
                    lineHeight: "1.65",
                  }}
                >
                  {text}
                </SyntaxHighlighter>
              </div>
            );
          },

          p({ children }) {
            return <p className="mb-3 last:mb-0 leading-[1.8] text-foreground/90">{children}</p>;
          },

          h1({ children }) { return <h1 className="text-xl font-bold text-foreground mt-5 mb-3 pb-2 border-b border-border">{children}</h1>; },
          h2({ children }) { return <h2 className="text-[17px] font-semibold text-foreground mt-4 mb-2">{children}</h2>; },
          h3({ children }) { return <h3 className="text-base font-semibold text-foreground mt-3 mb-1.5">{children}</h3>; },

          ul({ children }) { return <ul className="my-3 space-y-1.5 list-none pl-0">{children}</ul>; },
          ol({ children }) { return <ol className="my-3 space-y-1.5 list-decimal pl-5">{children}</ol>; },

          li({ children, node }) {
            // Detect task list items
            const childArr = React.Children.toArray(children);
            const firstChild = childArr[0] as any;
            const isInput = firstChild?.type === 'input';
            if (isInput) {
              const checked = firstChild?.props?.checked;
              return (
                <li className="flex items-start gap-2.5 leading-relaxed">
                  <span className={cn(
                    "mt-1 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors",
                    checked
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border bg-secondary/30"
                  )}>
                    {checked && <Check className="w-2.5 h-2.5" />}
                  </span>
                  <span className={cn("text-foreground/90", checked && "line-through text-muted-foreground/60")}>{childArr.slice(1)}</span>
                </li>
              );
            }
            return (
              <li className="leading-relaxed flex gap-2.5 items-start">
                <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                <span className="text-foreground/90">{children}</span>
              </li>
            );
          },

          blockquote({ children }) {
            const callout = detectCallout(children);
            if (callout) {
              const cfg = CALLOUT_CONFIGS[callout.type];
              const Icon = cfg.icon;
              return (
                <div className={cn("my-3 rounded-xl border-l-4 p-4", cfg.border, cfg.bg)}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={cn("w-4 h-4", cfg.iconColor)} />
                    <span className={cn("text-xs font-semibold uppercase tracking-wide", cfg.iconColor)}>{cfg.label}</span>
                  </div>
                  <div className="text-sm text-foreground/90 leading-relaxed">{callout.text}</div>
                </div>
              );
            }
            return (
              <blockquote className="my-3 pl-4 border-l-2 border-primary/40 text-muted-foreground italic rounded-sm">
                {children}
              </blockquote>
            );
          },

          a({ children, href }) {
            return <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80 underline underline-offset-2 break-all">{children}</a>;
          },
          strong({ children }) { return <strong className="font-semibold text-foreground">{children}</strong>; },
          em({ children }) { return <em className="italic text-foreground/80">{children}</em>; },
          hr() { return <hr className="my-4 border-border" />; },

          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-xl border border-border shadow-sm">
                <table className="w-full text-sm border-collapse">{children}</table>
              </div>
            );
          },
          thead({ children }) { return <thead className="bg-secondary/70">{children}</thead>; },
          tr({ children }) { return <tr className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">{children}</tr>; },
          th({ children }) { return <th className="px-4 py-2.5 text-left font-semibold text-foreground border-r border-border/30 last:border-r-0">{children}</th>; },
          td({ children }) { return <td className="px-4 py-2.5 text-foreground/80 border-r border-border/30 last:border-r-0">{children}</td>; },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
