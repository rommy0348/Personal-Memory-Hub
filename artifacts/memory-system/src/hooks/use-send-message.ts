import { useState, useCallback } from "react";
import type { ThinkingMode } from "@/components/Chat/ThinkingModeButton";
import type { ApiSettings } from "@/context/AppContext";

const BASE = "/api";

export interface SendMessageOptions {
  message: string;
  folderId?: number | null;
  conversationId?: number | null;
  useMemories?: boolean;
  thinkingMode?: ThinkingMode;
  thinkingBudget?: number;
  apiSettings?: ApiSettings;
}

export interface SendMessageResult {
  reply: string;
  usedMemories: any[];
  messageId: number;
  conversationId: number;
}

export function useSendMessage() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (opts: SendMessageOptions): Promise<SendMessageResult | null> => {
    setIsPending(true);
    setError(null);
    try {
      const body: Record<string, any> = {
        message: opts.message,
        folderId: opts.folderId ?? null,
        conversationId: opts.conversationId ?? null,
        useMemories: opts.useMemories ?? true,
        thinkingMode: opts.thinkingMode ?? "auto",
        thinkingBudget: opts.thinkingBudget,
      };
      if (opts.apiSettings?.enabled) {
        body.apiBaseUrl = opts.apiSettings.baseUrl;
        body.apiKey = opts.apiSettings.apiKey;
        body.model = opts.apiSettings.model;
      }
      const res = await fetch(`${BASE}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (e: any) {
      setError(e?.message || "发送失败");
      return null;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { send, isPending, error };
}
