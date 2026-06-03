import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Trophy, Target, Flame, Plus, ThumbsUp, ThumbsDown, Crown, Loader2 } from "lucide-react";
import { COMMODITIES } from "@/lib/commodities";

interface Prediction {
  id: string;
  user_id: string;
  symbol: string;
  direction: "long" | "short";
  entry_price: number | null;
  target_price: number | null;
  stop_loss: number | null;
  confidence: number;
  timeframe: string;
  thesis: string | null;
  status: string;
  agree_count: number;
  disagree_count: number;
  created_at: string;
  resolved_at: string | null;
}

interface TraderScore {
  user_id: string;
  total_predictions: number;
  correct_predictions: number;
  accuracy_percentage: number;
  current_streak: number;
  best_streak: number;
  reputation_points: number;
  rank_tier: string;
}

interface ProfileLite {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

const tierColor = (tier: string) => {
  switch (tier) {
    case "Legend": return "bg-gradient-to-r from-amber-500 to-yellow-300 text-black";
    case "Elite": return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
    case "Pro": return "bg-primary text-primary-foreground";
    case "Veteran": return "bg-blue-500 text-white";
    case "Trader": return "bg-secondary text-secondary-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

export const PredictionsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [leaderboard, setLeaderboard] = useState<TraderScore[]>([]);
  const [myScore, setMyScore] = useState<TraderScore | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  // composer state
  const [symbol, setSymbol] = useState(COMMODITIES[0]?.symbol ?? "GC");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [entry, setEntry] = useState("");
  const [target, setTarget] = useState("");
  const [stop, setStop] = useState("");
  const [confidence, setConfidence] = useState("70");
  const [timeframe, setTimeframe] = useState("1d");
  const [thesis, setThesis] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [predRes, lbRes, meRes] = await Promise.all([
      supabase.from("predictions").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("trader_scores").select("*").order("reputation_points", { ascending: false }).limit(25),
      user ? supabase.from("trader_scores").select("*").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null } as any),
    ]);
    const preds = (predRes.data ?? []) as Prediction[];
    setPredictions(preds);
    const lb = (lbRes.data ?? []) as TraderScore[];
    setLeaderboard(lb);
    setMyScore((meRes as any).data ?? null);

    const ids = Array.from(new Set([...preds.map(p => p.user_id), ...lb.map(s => s.user_id)]));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id,username,display_name,avatar_url").in("user_id", ids);
      const map: Record<string, ProfileLite> = {};
      (profs ?? []).forEach((p: any) => { map[p.user_id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const submit = async () => {
    if (!user) { toast({ title: "Login required" }); return; }
    if (!symbol || !thesis.trim()) { toast({ title: "Symbol and thesis required" }); return; }
    setSubmitting(true);
    const { error } = await supabase.from("predictions").insert({
      user_id: user.id,
      symbol,
      direction,
      entry_price: entry ? Number(entry) : null,
      target_price: target ? Number(target) : null,
      stop_loss: stop ? Number(stop) : null,
      confidence: Math.max(1, Math.min(100, Number(confidence) || 50)),
      timeframe,
      thesis: thesis.trim(),
    });
    setSubmitting(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Prediction posted 🎯" });
    setComposerOpen(false);
    setThesis(""); setEntry(""); setTarget(""); setStop("");
    load();
  };

  const vote = async (predictionId: string, v: "agree" | "disagree") => {
    if (!user) { toast({ title: "Login to vote" }); return; }
    const { error } = await supabase.from("prediction_votes").upsert(
      { prediction_id: predictionId, user_id: user.id, vote: v },
      { onConflict: "prediction_id,user_id" }
    );
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    load();
  };

  const resolve = async (p: Prediction, outcome: "correct" | "wrong") => {
    if (!user || user.id !== p.user_id) return;
    const { error } = await supabase.from("predictions").update({
      status: outcome,
      resolved_at: new Date().toISOString(),
    }).eq("id", p.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: outcome === "correct" ? "Marked correct ✅" : "Marked wrong" });
    load();
  };

  return (
    <div className="pb-24 px-3 pt-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Predictions</h1>
          <p className="text-xs text-muted-foreground">Make calls. Build reputation.</p>
        </div>
        <Button size="sm" onClick={() => setComposerOpen(o => !o)} className="bg-gradient-ember">
          <Plus className="w-4 h-4 mr-1" /> Call
        </Button>
      </div>

      {myScore && (
        <Card className="p-3 glass">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={tierColor(myScore.rank_tier)}>{myScore.rank_tier}</Badge>
              <span className="text-sm font-semibold">{myScore.reputation_points} pts</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span><Trophy className="w-3 h-3 inline mr-1" />{myScore.accuracy_percentage.toFixed(0)}%</span>
              <span><Flame className="w-3 h-3 inline mr-1" />{myScore.current_streak}</span>
              <span>{myScore.correct_predictions}/{myScore.total_predictions}</span>
            </div>
          </div>
        </Card>
      )}

      {composerOpen && (
        <Card className="p-3 space-y-2 border-primary/40">
          <div className="grid grid-cols-2 gap-2">
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMMODITIES.map(c => <SelectItem key={c.symbol} value={c.symbol}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={direction} onValueChange={(v: any) => setDirection(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="long">📈 Long</SelectItem>
                <SelectItem value="short">📉 Short</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Entry" inputMode="decimal" value={entry} onChange={e => setEntry(e.target.value)} />
            <Input placeholder="Target" inputMode="decimal" value={target} onChange={e => setTarget(e.target.value)} />
            <Input placeholder="Stop" inputMode="decimal" value={stop} onChange={e => setStop(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Confidence 1-100" inputMode="numeric" value={confidence} onChange={e => setConfidence(e.target.value)} />
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 hour</SelectItem>
                <SelectItem value="1d">1 day</SelectItem>
                <SelectItem value="1w">1 week</SelectItem>
                <SelectItem value="1m">1 month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea placeholder="Your thesis..." value={thesis} onChange={e => setThesis(e.target.value)} rows={3} />
          <Button onClick={submit} disabled={submitting} className="w-full bg-gradient-ember">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Prediction"}
          </Button>
        </Card>
      )}

      <Tabs defaultValue="feed">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="feed">Live Calls</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-2 mt-2">
          {loading ? <Skeleton className="h-40 w-full" /> :
            predictions.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">No predictions yet. Be the first.</Card>
            ) : predictions.map(p => {
              const prof = profiles[p.user_id];
              const isMine = user?.id === p.user_id;
              const isOpen = p.status === "open";
              return (
                <Card key={p.id} className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                        {prof?.avatar_url && <img src={prof.avatar_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">@{prof?.username ?? "trader"}</div>
                        <div className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <Badge variant={p.status === "correct" ? "default" : p.status === "wrong" ? "destructive" : "secondary"}>
                      {p.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={p.direction === "long" ? "bg-emerald-600" : "bg-red-600"}>
                      {p.direction === "long" ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {p.symbol} {p.direction.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">{p.timeframe}</Badge>
                    <Badge variant="outline">{p.confidence}% conf</Badge>
                  </div>

                  {(p.entry_price || p.target_price || p.stop_loss) && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><div className="text-muted-foreground">Entry</div><div className="font-mono">{p.entry_price ?? "—"}</div></div>
                      <div><div className="text-muted-foreground">Target</div><div className="font-mono text-emerald-500">{p.target_price ?? "—"}</div></div>
                      <div><div className="text-muted-foreground">Stop</div><div className="font-mono text-red-500">{p.stop_loss ?? "—"}</div></div>
                    </div>
                  )}

                  {p.thesis && <p className="text-sm text-foreground/90">{p.thesis}</p>}

                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => vote(p.id, "agree")} className="h-7 px-2">
                        <ThumbsUp className="w-3.5 h-3.5 mr-1" />{p.agree_count}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => vote(p.id, "disagree")} className="h-7 px-2">
                        <ThumbsDown className="w-3.5 h-3.5 mr-1" />{p.disagree_count}
                      </Button>
                    </div>
                    {isMine && isOpen && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => resolve(p, "correct")}>✅ Hit</Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => resolve(p, "wrong")}>❌ Miss</Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-2 mt-2">
          {loading ? <Skeleton className="h-40 w-full" /> :
            leaderboard.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">No ranked traders yet.</Card>
            ) : leaderboard.map((s, i) => {
              const prof = profiles[s.user_id];
              return (
                <Card key={s.user_id} className="p-3 flex items-center gap-3">
                  <div className="w-7 text-center font-bold text-muted-foreground">
                    {i === 0 ? <Crown className="w-5 h-5 text-amber-400 mx-auto" /> : `#${i + 1}`}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-muted overflow-hidden">
                    {prof?.avatar_url && <img src={prof.avatar_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">@{prof?.username ?? "trader"}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={`${tierColor(s.rank_tier)} text-[10px] py-0`}>{s.rank_tier}</Badge>
                      <span className="text-[10px] text-muted-foreground">{s.accuracy_percentage.toFixed(0)}% · {s.correct_predictions}/{s.total_predictions}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-primary">{s.reputation_points}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Flame className="w-3 h-3" />{s.best_streak}</div>
                  </div>
                </Card>
              );
            })}
        </TabsContent>
      </Tabs>
    </div>
  );
};
