import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { Send, Sparkles, Plus, Menu, Trash2, MessageSquare, Brain, Target, TrendingUp, BookOpen, Loader2, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "user" | "assistant" | "system";
interface Msg { id?: string; role: Role; content: string; }
interface Conversation { id: string; title: string; last_message_at: string; }

const STARTER_PROMPTS = [
  { icon: TrendingUp, label: "Crude oil setup today", prompt: "Give me a clean read on crude oil right now — bias, key levels, and the cleanest setup if any." },
  { icon: Target, label: "Size a gold trade", prompt: "I have a $25k futures account. Walk me through position sizing a gold (GC) long with a $20 stop." },
  { icon: BookOpen, label: "Explain contango", prompt: "Explain contango vs backwardation in plain English, with how it affects rolling natural gas futures." },
  { icon: Brain, label: "Fix my discipline", prompt: "I keep moving my stops and overtrading. Give me a 5-rule playbook to fix it this week." },
];

export const ChatPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadConversations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_conversations")
      .select("id,title,last_message_at")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false })
      .limit(30);
    setConversations((data as Conversation[]) ?? []);
  };

  const loadMessages = async (convId: string) => {
    setLoadingMsgs(true);
    const { data } = await supabase
      .from("chat_messages")
      .select("id,role,content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages(((data as any[]) ?? []).map(m => ({ id: m.id, role: m.role as Role, content: m.content })));
    setLoadingMsgs(false);
  };

  useEffect(() => { loadConversations(); }, [user?.id]);
  useEffect(() => { if (activeId) loadMessages(activeId); else setMessages([]); }, [activeId]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, streaming]);

  const newChat = () => { setActiveId(null); setMessages([]); setDrawerOpen(false); };

  const deleteChat = async (id: string) => {
    await supabase.from("chat_conversations").delete().eq("id", id);
    if (activeId === id) newChat();
    loadConversations();
  };

  const ensureConversation = async (firstMessage: string): Promise<string | null> => {
    if (activeId) return activeId;
    if (!user) return null;
    const title = firstMessage.slice(0, 60).replace(/\s+/g, " ").trim() || "New chat";
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ user_id: user.id, title })
      .select()
      .single();
    if (error) { toast({ title: "Could not start chat", description: error.message, variant: "destructive" }); return null; }
    setActiveId(data.id);
    loadConversations();
    return data.id;
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    if (!user) { toast({ title: "Sign in to chat", variant: "destructive" }); return; }

    const convId = await ensureConversation(trimmed);
    if (!convId) return;

    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    // Persist user message
    supabase.from("chat_messages").insert({
      conversation_id: convId, user_id: user.id, role: "user", content: trimmed,
    }).then(() => {});

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session.session?.access_token;
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/charted-chat`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        signal: ctrl.signal,
        body: JSON.stringify({
          conversation_id: convId,
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (resp.status === 429) { toast({ title: "Slow down", description: "Rate limit hit, try again in a moment.", variant: "destructive" }); throw new Error("rate"); }
      if (resp.status === 402) { toast({ title: "Out of AI credits", description: "Add credits to keep chatting.", variant: "destructive" }); throw new Error("credits"); }
      if (!resp.ok || !resp.body) throw new Error("Chat failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages(prev => {
                const copy = prev.slice();
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch {
            buffer = line + "\n" + buffer; break;
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError" && e.message !== "rate" && e.message !== "credits") {
        toast({ title: "Chat failed", description: e?.message ?? "Try again", variant: "destructive" });
      }
      setMessages(prev => prev.slice(0, -1)); // drop empty assistant
    } finally {
      setStreaming(false);
      abortRef.current = null;
      loadConversations();
    }
  };

  const stop = () => { abortRef.current?.abort(); setStreaming(false); };

  if (!user) {
    return (
      <div className="pb-24 px-4 pt-6">
        <Card className="p-6 text-center space-y-3">
          <Sparkles className="w-10 h-10 mx-auto text-primary" />
          <h2 className="font-display text-xl font-bold">Charted Chat</h2>
          <p className="text-sm text-muted-foreground">Sign in to talk to your AI trading copilot — markets, setups, journaling, psychology.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] pb-16">
      {/* Header */}
      <div className="sticky top-0 glass border-b hairline z-30 px-3 py-2.5 flex items-center justify-between">
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="p-3 border-b hairline flex items-center justify-between">
              <p className="font-display font-bold text-sm">Chats</p>
              <Button size="sm" variant="ghost" onClick={newChat} className="rounded-full h-8">
                <Plus className="w-4 h-4 mr-1" />New
              </Button>
            </div>
            <div className="overflow-y-auto h-[calc(100vh-3rem)]">
              {conversations.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4 text-center">No chats yet.</p>
              ) : conversations.map(c => (
                <div
                  key={c.id}
                  className={cn("group flex items-center justify-between px-3 py-2.5 border-b hairline cursor-pointer active:scale-[0.99] transition-transform",
                    activeId === c.id && "bg-primary/10")}
                  onClick={() => { setActiveId(c.id); setDrawerOpen(false); }}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <p className="text-xs truncate">{c.title}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }}
                    className="opacity-60 hover:opacity-100 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-ember flex items-center justify-center shadow-ember">
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display font-bold text-sm leading-none">Charted Chat</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">AI copilot for traders</p>
          </div>
        </div>

        <button onClick={newChat} className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.length === 0 && !loadingMsgs && (
          <div className="space-y-4 pt-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-ember mx-auto flex items-center justify-center shadow-ember">
                <Sparkles className="w-7 h-7 text-primary-foreground" />
              </div>
              <h2 className="font-display text-xl font-bold">How can I help you trade?</h2>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">Ask about commodities setups, risk, psychology — anything a senior mentor would help with.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {STARTER_PROMPTS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <button
                    key={i}
                    onClick={() => send(s.prompt)}
                    className="p-3 rounded-xl border hairline bg-card/50 text-left active:scale-[0.97] transition-transform"
                  >
                    <Icon className="w-4 h-4 text-primary mb-1.5" />
                    <p className="text-xs font-semibold leading-snug">{s.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={m.id ?? i} role={m.role} content={m.content} streaming={streaming && i === messages.length - 1 && m.role === "assistant"} />
        ))}
      </div>

      {/* Composer */}
      <div className="border-t hairline glass p-2.5 sticky bottom-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 rounded-2xl border hairline bg-background/80 px-3 py-2 flex items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask anything trading…"
              rows={1}
              className="w-full resize-none bg-transparent outline-none text-sm max-h-32"
              style={{ minHeight: "20px" }}
            />
          </div>
          {streaming ? (
            <button onClick={stop} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center active:scale-95">
              <StopCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => send(input)}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-full bg-gradient-ember shadow-ember flex items-center justify-center active:scale-95 disabled:opacity-40"
            >
              <Send className="w-4 h-4 text-primary-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ role, content, streaming }: { role: Role; content: string; streaming?: boolean }) => {
  const isUser = role === "user";
  return (
    <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-gradient-ember flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
      )}
      <div className={cn(
        "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm",
        isUser ? "bg-gradient-ember text-primary-foreground rounded-br-sm" : "bg-muted/50 rounded-bl-sm"
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : content ? (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0 prose-pre:my-2 prose-pre:bg-background/60 prose-pre:text-xs prose-code:text-xs prose-strong:text-foreground prose-blockquote:border-primary prose-blockquote:text-muted-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            {streaming && <span className="inline-block w-1.5 h-3.5 bg-primary animate-pulse ml-0.5 align-middle" />}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 py-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-xs text-muted-foreground">Thinking…</span>
          </div>
        )}
      </div>
    </div>
  );
};
