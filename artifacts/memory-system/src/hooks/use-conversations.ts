import { useState, useEffect, useCallback } from "react";

const BASE = "/api";

export interface ConversationItem {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConvMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  conversationId: number;
  folderId: number | null;
  isStarred: boolean;
  createdAt: string;
}

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
}

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/conversations");
      setConversations(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (title = "新对话"): Promise<ConversationItem | null> => {
    try {
      const conv = await apiFetch("/conversations", { method: "POST", body: JSON.stringify({ title }) });
      setConversations(prev => [conv, ...prev]);
      return conv;
    } catch { return null; }
  }, []);

  const rename = useCallback(async (id: number, title: string) => {
    try {
      const updated = await apiFetch(`/conversations/${id}`, { method: "PATCH", body: JSON.stringify({ title }) });
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
    } catch {}
  }, []);

  const remove = useCallback(async (id: number) => {
    try {
      await apiFetch(`/conversations/${id}`, { method: "DELETE" });
      setConversations(prev => prev.filter(c => c.id !== id));
    } catch {}
  }, []);

  const branch = useCallback(async (conversationId: number, upToMessageId: number, title: string): Promise<ConversationItem | null> => {
    try {
      const conv = await apiFetch("/conversations/branch", { method: "POST", body: JSON.stringify({ conversationId, upToMessageId, title }) });
      setConversations(prev => [conv, ...prev]);
      return conv;
    } catch { return null; }
  }, []);

  const starMessage = useCallback(async (messageId: number, isStarred: boolean) => {
    try {
      await apiFetch(`/conversations/messages/${messageId}/star`, { method: "PATCH", body: JSON.stringify({ isStarred }) });
    } catch {}
  }, []);

  const getMessages = useCallback(async (conversationId: number): Promise<ConvMessage[]> => {
    try {
      return await apiFetch(`/conversations/${conversationId}/messages`);
    } catch { return []; }
  }, []);

  return { conversations, loading, load, create, rename, remove, branch, starMessage, getMessages };
}

export function useConversationMessages(conversationId: number | null, refreshToken?: number) {
  const [messages, setMessages] = useState<ConvMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) { setMessages([]); return; }
    setLoading(true);
    fetch(`${BASE}/conversations/${conversationId}/messages`)
      .then(r => r.json())
      .then(data => setMessages(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [conversationId, refreshToken]);

  return { messages, loading, refresh: () => setMessages(m => [...m]) };
}
