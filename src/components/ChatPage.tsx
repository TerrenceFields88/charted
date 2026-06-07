import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Send, Sparkles, Plus, Menu, Trash2, MessageSquare, Brain, Target, TrendingUp, BookOpen, Loader2, StopCircle, LogOut, UserCog, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "user" | "assistant" | "system";
interface Msg { id?: string; role: Role; content: string; }
interface Conversation { id: string; title: string; last_message_at: string; }

const STARTER_PROMPTS = [
  { icon: TrendingUp, label: "Read crude oil now", prompt: "Give me a clean read on crude oil right now — bias, key levels, and the cleanest setup if any." },
  { icon: Target, label: "Size a gold trade", prompt: "I have a $25k futures account. Walk me through position sizing a gold (GC) long with a $20 stop." },
  { icon: BookOpen, label: "Explain contango", prompt: "Explain contango vs backwardation in plain English, with how it affects rolling natural gas futures." },
  { icon: Brain, label: "Fix my discipline", prompt: "I keep moving my stops and overtrading. Give me a 5-rule playbook to fix it this week." },
];

const SUGGESTED_FOLLOWUPS = ["What's the macro driver?", "Where's invalidation?", "Give me a tighter entry"];

export const ChatPage = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
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
      <div className="pb-24 px-4 pt-10 max-w-md mx-auto">
        <Card className="p-8 text-center space-y-5 bg-card/60 border-border/40 backdrop-blur-xl">
          <div className="w-14 h-14 rounded-2xl bg-gradient-ember mx-auto flex items-center justify-center shadow-ember">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <h2 className="font-display text-3xl">Your AI trading desk</h2>
          <p className="text-sm text-muted-foreground">Sign in to ask anything — setups, sizing, journaling, psychology. Your personal copilot for commodities futures.</p>
          <Button onClick={() => navigate('/auth')} className="w-full rounded-full bg-gradient-ember shadow-ember">
            <LogIn className="w-4 h-4 mr-2" /> Sign in to start
          </Button>
        </Card>
      </div>
    );
  }

  const initials = (profile?.display_name || profile?.username || user.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] pb-16">
      {/* Header — editorial */}
      <div className="sticky top-0 glass border-b border-border/40 z-30 px-3 py-2.5 flex items-center justify-between">
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform hover:bg-muted/40">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 bg-card/95 backdrop-blur-xl">
            <div className="p-4 border-b border-border/40 flex items-center justify-between">
              <div>
                <p className="font-display text-xl leading-none">Conversations</p>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">Your chats with Charted</p>
              </div>
              <Button size="sm" variant="ghost" onClick={newChat} className="rounded-full h-8">
                <Plus className="w-4 h-4 mr-1" />New
              </Button>
            </div>
            <div className="overflow-y-auto h-[calc(100vh-5rem)]">
              {conversations.length === 0 ? (
                <p className="text-xs text-muted-foreground p-6 text-center font-display-italic text-base">No conversations yet.</p>
              ) : conversations.map(c => (
                <div
                  key={c.id}
                  className={cn("group flex items-center justify-between px-4 py-3 border-b border-border/30 cursor-pointer active:scale-[0.99] transition-transform",
                    activeId === c.id && "bg-primary/10 border-l-2 border-l-primary")}
                  onClick={() => { setActiveId(c.id); setDrawerOpen(false); }}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <p className="text-sm truncate">{c.title}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }}
                    className="opacity-50 hover:opacity-100 ml-2 hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-gradient-ember blur-md opacity-50" />
            <div className="relative w-8 h-8 rounded-lg bg-gradient-ember flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
          <div>
            <p className="font-display text-lg leading-none">Charted</p>
            <p className="text-[9px] text-muted-foreground tracking-widest uppercase mt-0.5">AI · Commodities Desk</p>
          </div>
        </div>

        <button onClick={newChat} className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform hover:bg-muted/40">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Messages — centered editorial column */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          {messages.length === 0 && !loadingMsgs && (
            <div className="space-y-8 pt-8 animate-fade-in">
              <div className="text-center space-y-3">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-ember blur-2xl opacity-40 ai-pulse" />
                  <div className="relative w-20 h-20 rounded-3xl bg-gradient-ember mx-auto flex items-center justify-center shadow-ember ring-1 ring-primary/30">
                    <Sparkles className="w-9 h-9 text-primary-foreground" />
                  </div>
                </div>
                <h1 className="font-display text-4xl leading-tight">
                  How can I help <span className="font-display-italic text-gradient-gold">you trade</span>?
                </h1>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Ask anything about the eight commodities. Live reads, sizing, journaling, psychology — your senior mentor, always on.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STARTER_PROMPTS.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => send(s.prompt)}
                      className="group p-4 rounded-2xl border border-border/40 bg-card/40 text-left active:scale-[0.98] transition-all hover:border-primary/40 hover:bg-card/70"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-snug">{s.label}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{s.prompt}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-center text-muted-foreground/70 uppercase tracking-widest pt-4">
                Education only · Not financial advice
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <MessageBubble key={m.id ?? i} role={m.role} content={m.content} streaming={streaming && i === messages.length - 1 && m.role === "assistant"} />
          ))}

          {!streaming && messages.length > 1 && messages[messages.length - 1]?.role === "assistant" && (
            <div className="flex flex-wrap gap-2 pt-1 pl-9 animate-fade-in">
              {SUGGESTED_FOLLOWUPS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-[11px] px-3 py-1.5 rounded-full border border-border/40 bg-card/40 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors active:scale-95"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Composer — editorial pill */}
      <div className="border-t border-border/40 glass p-3 sticky bottom-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 rounded-3xl border border-border/50 bg-background/80 px-4 py-2.5 flex items-end gap-2 focus-within:border-primary/50 focus-within:shadow-ember transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder="Ask anything trading…"
                rows={1}
                className="w-full resize-none bg-transparent outline-none text-sm max-h-32 placeholder:text-muted-foreground/60"
                style={{ minHeight: "20px" }}
              />
            </div>
            {streaming ? (
              <button onClick={stop} className="w-11 h-11 rounded-full bg-muted flex items-center justify-center active:scale-95 ring-1 ring-border/40">
                <StopCircle className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => send(input)}
                disabled={!input.trim()}
                className="w-11 h-11 rounded-full bg-gradient-ember shadow-ember flex items-center justify-center active:scale-95 disabled:opacity-30 disabled:shadow-none transition-all"
              >
                <Send className="w-4 h-4 text-primary-foreground" />
              </button>
            )}
          </div>
          <p className="text-[9px] text-center text-muted-foreground/60 mt-2 tracking-wide">
            Charted can be wrong. Verify before risking capital.
          </p>
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ role, content, streaming }: { role: Role; content: string; streaming?: boolean }) => {
  const isUser = role === "user";
  return (
    <div className={cn("flex gap-2.5 animate-fade-in", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-gradient-ember flex items-center justify-center shrink-0 mt-0.5 shadow-ember">
          <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
      )}
      <div className={cn(
        "max-w-[85%] text-sm",
        isUser
          ? "rounded-2xl rounded-br-md px-4 py-2.5 bg-primary/15 text-foreground border border-primary/20"
          : "rounded-2xl rounded-bl-md px-4 py-3 bg-card/60 border border-border/40"
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : content ? (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-headings:font-display prose-headings:my-2 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0 prose-pre:my-2 prose-pre:bg-background/60 prose-pre:border prose-pre:border-border/40 prose-pre:text-xs prose-code:text-xs prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-strong:text-primary prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:italic prose-table:text-xs prose-th:border-border/40 prose-td:border-border/40 prose-a:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            {streaming && <span className="inline-block w-1.5 h-3.5 bg-primary animate-pulse ml-0.5 align-middle rounded-sm" />}
          </div>
        ) : (
          <div className="flex items-center gap-2 py-1">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-primary rounded-full ai-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-primary rounded-full ai-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-primary rounded-full ai-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-muted-foreground font-display-italic">Thinking</span>
          </div>
        )}
      </div>
    </div>
  );
};
