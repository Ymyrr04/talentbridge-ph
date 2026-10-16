import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessagesSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/AppShell";
import { MESSAGE_MAX, myConversations, threadMessages } from "@/lib/messages";
import { cn } from "@/lib/utils";

type Side = "client" | "applicant";

export function Messenger({ userId, side, initial }: { userId: string; side: Side; initial?: string | undefined }) {
  const { data: convs = [], isLoading } = useQuery(myConversations);
  const [selected, setSelected] = useState<string | undefined>(initial);
  const conv = convs.find((c) => c.id === selected);

  if (isLoading) return null;
  if (convs.length === 0)
    return (
      <EmptyState
        icon={<MessagesSquare className="h-6 w-6" />}
        title="No messages yet"
        body={side === "client" ? "Message an applicant from the Applications page to start a conversation." : "When a client messages you about an application, it'll show up here."}
      />
    );

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[420px] overflow-hidden rounded-2xl border bg-card">
      <aside className={cn("w-full shrink-0 overflow-y-auto border-r md:block md:w-80", conv && "hidden")}>
        {convs.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className={cn("flex w-full flex-col gap-0.5 border-b px-4 py-3 text-left transition-colors hover:bg-muted", c.id === selected && "bg-secondary")}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-semibold">{c.other_name || "Unnamed"}</span>
              {c.unread > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">{c.unread}</span>
              )}
            </div>
            <span className="truncate text-xs text-muted-foreground">{c.job_title}</span>
            <span className={cn("truncate text-sm", c.unread > 0 ? "font-medium text-foreground" : "text-muted-foreground")}>
              {c.last_sender_id === userId ? "You: " : ""}{c.last_body}
            </span>
          </button>
        ))}
      </aside>
      {conv ? (
        <Thread key={conv.id} userId={userId} conv={conv} side={side} onBack={() => setSelected(undefined)} />
      ) : (
        <div className="hidden flex-1 place-items-center text-sm text-muted-foreground md:grid">Select a conversation</div>
      )}
    </div>
  );
}

type Conv = { id: string; other_name: string; role_title: string; job_title: string };

function Thread({ userId, conv, side, onBack }: { userId: string; conv: Conv; side: Side; onBack: () => void }) {
  const qc = useQueryClient();
  const { data: msgs = [] } = useQuery(threadMessages(conv.id));
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const hasUnread = msgs.some((m) => m.sender_id !== userId && !m.read_at);

  useEffect(() => {
    if (!hasUnread) return;
    supabase.rpc("mark_read", { _conversation_id: conv.id }).then(() => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["unread-count"] });
      qc.invalidateQueries({ queryKey: ["thread", conv.id] });
    });
  }, [hasUnread, conv.id, qc]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs.length]);

  const lastMine = [...msgs].reverse().find((m) => m.sender_id === userId);

  async function send() {
    const text = body.trim();
    if (!text || sending) return;
    if (text.length > MESSAGE_MAX) { toast.error(`Messages can be up to ${MESSAGE_MAX} characters.`); return; }
    setSending(true);
    const { error } = await supabase.from("messages").insert({ conversation_id: conv.id, body: text });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setBody("");
    qc.invalidateQueries({ queryKey: ["thread", conv.id] });
    qc.invalidateQueries({ queryKey: ["conversations"] });
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack} aria-label="Back to conversations">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <p className="truncate font-semibold">{conv.other_name || "Unnamed"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {side === "client" ? `${conv.role_title} · ${conv.job_title}` : conv.job_title}
          </p>
        </div>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {msgs.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
              <div className={cn("max-w-[80%] whitespace-pre-line break-words rounded-2xl px-3.5 py-2 text-sm", mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                {m.body}
              </div>
              {m.id === lastMine?.id && m.read_at && <span className="mt-0.5 text-xs text-muted-foreground">Seen</span>}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form className="flex items-end gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Write a message"
          maxLength={MESSAGE_MAX}
          rows={1}
          className="max-h-32 min-h-10 resize-none"
        />
        <Button type="submit" disabled={sending || !body.trim()}><Send className="h-4 w-4" /> Send</Button>
      </form>
    </section>
  );
}
