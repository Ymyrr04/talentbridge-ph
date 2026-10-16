import { useEffect } from "react";
import { queryOptions, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const MESSAGE_MAX = 2000;

export const myConversations = queryOptions({
  queryKey: ["conversations"],
  queryFn: async () => {
    const { data, error } = await supabase.rpc("my_conversations");
    if (error) throw error;
    return (data ?? []).map((c) => ({ ...c, unread: Number(c.unread) }));
  },
});

export const unreadCount = queryOptions({
  queryKey: ["unread-count"],
  queryFn: async () => {
    const { data, error } = await supabase.rpc("unread_message_count");
    if (error) throw error;
    return Number(data ?? 0);
  },
});

export const threadMessages = (conversationId: string) =>
  queryOptions({
    queryKey: ["thread", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, body, created_at, read_at")
        .eq("conversation_id", conversationId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

/** Conversation ids keyed by application id, for the client's applications page. */
export const conversationsByApplication = queryOptions({
  queryKey: ["conversations", "by-application"],
  queryFn: async () => {
    const { data, error } = await supabase.from("conversations").select("id, application_id");
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((c) => [c.application_id, c.id])) as Record<string, string>;
  },
});

/** One live subscription per signed-in shell; RLS limits events to the user's own threads. */
export function useMessagesRealtime(enabled: boolean) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel("my-messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        qc.invalidateQueries({ queryKey: ["conversations"] });
        qc.invalidateQueries({ queryKey: ["unread-count"] });
        qc.invalidateQueries({ queryKey: ["thread"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, qc]);
}
