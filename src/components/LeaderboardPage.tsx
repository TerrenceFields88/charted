import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Flame, Target, TrendingUp, Crown, Medal, Award, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type Score = {
  user_id: string;
  reputation_points: number;
  accuracy_percentage: number;
  total_predictions: number;
  correct_predictions: number;
  current_streak: number;
  best_streak: number;
  rank_tier: string;
};

type Profile = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  verified_trader: boolean | null;
};

type Row = Score & { profile?: Profile };

type Sort = "reputation" | "accuracy" | "streak";

const tierStyles: Record<string, string> = {
  Legend: "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/40",
  Elite: "bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 text-fuchsia-300 border-fuchsia-500/40",
  Pro: "bg-gradient-to-r from-sky-500/20 to-cyan-500/20 text-sky-300 border-sky-500/40",
  Veteran: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Trader: "bg-muted/40 text-foreground border-border",
  Rookie: "bg-muted/30 text-muted-foreground border-border",
};

export const LeaderboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<Sort>("reputation");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: scores } = await supabase
        .from("trader_scores")
        .select("user_id,reputation_points,accuracy_percentage,total_predictions,correct_predictions,current_streak,best_streak,rank_tier")
        .gt("total_predictions", 0)
        .order("reputation_points", { ascending: false })
        .limit(100);

      const list = (scores ?? []) as Score[];
      const ids = list.map((s) => s.user_id);
      let profileMap = new Map<string, Profile>();
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id,username,display_name,avatar_url,verified_trader")
          .in("user_id", ids);
        (profs ?? []).forEach((p: any) => profileMap.set(p.user_id, p));
      }
      setRows(list.map((s) => ({ ...s, profile: profileMap.get(s.user_id) })));
      setLoading(false);
    })();
  }, []);

  const sorted = useMemo(() => {
    const copy = [...rows];
    if (sort === "accuracy") copy.sort((a, b) => b.accuracy_percentage - a.accuracy_percentage || b.total_predictions - a.total_predictions);
    else if (sort === "streak") copy.sort((a, b) => b.best_streak - a.best_streak || b.current_streak - a.current_streak);
    else copy.sort((a, b) => b.reputation_points - a.reputation_points);
    return copy;
  }, [rows, sort]);

  const me = rows.find((r) => r.user_id === user?.id);
  const myRank = me ? sorted.findIndex((r) => r.user_id === me.user_id) + 1 : 0;
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const goProfile = (r: Row) => {
    if (r.profile?.username) navigate(`/u/${r.profile.username}`);
    else navigate(`/user/${r.user_id}`);
  };

  return (
    <div className="pb-24 select-none">
      <div className="sticky top-12 z-40 glass border-b border-border/40 px-4 py-3 flex items-center gap-3">
        <button onClick={() => window.dispatchEvent(new CustomEvent('charted:nav', { detail: 'coach' }))} className="p-1.5 rounded-full hover:bg-muted/40 active:scale-90">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <div>
            <h1 className="text-base font-bold leading-tight">Leaderboard</h1>
            <p className="text-[10px] text-muted-foreground">Top commodities forecasters</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: "reputation", label: "Reputation", icon: Trophy },
            { id: "accuracy", label: "Accuracy", icon: Target },
            { id: "streak", label: "Streak", icon: Flame },
          ] as const).map((t) => {
            const Icon = t.icon;
            const active = sort === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSort(t.id)}
                className={cn(
                  "rounded-xl border px-3 py-2 flex flex-col items-center gap-1 active:scale-95 transition",
                  active ? "border-primary/50 bg-primary/10 text-primary" : "border-border/40 text-muted-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">{t.label}</span>
              </button>
            );
          })}
        </div>

        {me && (
          <Card className="p-3 flex items-center gap-3 bg-gradient-to-r from-primary/10 to-transparent border-primary/30">
            <div className="text-xs font-bold w-8 text-center text-primary">#{myRank || "—"}</div>
            <Avatar className="w-9 h-9">
              <AvatarImage src={me.profile?.avatar_url ?? undefined} />
              <AvatarFallback>{(me.profile?.display_name ?? "Y")[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">You · {me.profile?.display_name ?? me.profile?.username ?? "Anonymous"}</p>
              <p className="text-[11px] text-muted-foreground">{me.reputation_points} rep · {me.accuracy_percentage.toFixed(1)}% acc · {me.current_streak}🔥</p>
            </div>
            <Badge variant="outline" className={cn("text-[10px]", tierStyles[me.rank_tier] ?? tierStyles.Rookie)}>{me.rank_tier}</Badge>
          </Card>
        )}

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
        ) : sorted.length === 0 ? (
          <Card className="p-8 text-center space-y-2">
            <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-sm font-semibold">No ranked traders yet</p>
            <p className="text-xs text-muted-foreground">Be the first — post a prediction and climb the board.</p>
          </Card>
        ) : (
          <>
            {top3.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {[1, 0, 2].map((idx) => {
                  const r = top3[idx];
                  if (!r) return <div key={idx} />;
                  const place = idx + 1;
                  const Icon = place === 1 ? Crown : place === 2 ? Medal : Award;
                  const color = place === 1 ? "text-amber-400" : place === 2 ? "text-slate-300" : "text-orange-400";
                  const scale = place === 1 ? "scale-105" : "";
                  return (
                    <button
                      key={r.user_id}
                      onClick={() => goProfile(r)}
                      className={cn("rounded-2xl p-3 border border-border/40 bg-card/60 backdrop-blur flex flex-col items-center gap-1 active:scale-95 transition", scale)}
                    >
                      <Icon className={cn("w-4 h-4", color)} />
                      <Avatar className="w-12 h-12 ring-2 ring-border/40">
                        <AvatarImage src={r.profile?.avatar_url ?? undefined} />
                        <AvatarFallback>{(r.profile?.display_name ?? r.profile?.username ?? "?")[0]}</AvatarFallback>
                      </Avatar>
                      <p className="text-[11px] font-semibold truncate max-w-full">{r.profile?.display_name ?? r.profile?.username ?? "Anonymous"}</p>
                      <p className={cn("text-[11px] font-bold", color)}>
                        {sort === "accuracy" ? `${r.accuracy_percentage.toFixed(1)}%` :
                         sort === "streak" ? `${r.best_streak}🔥` :
                         `${r.reputation_points}`}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="space-y-2">
              {rest.map((r, i) => (
                <button
                  key={r.user_id}
                  onClick={() => goProfile(r)}
                  className="w-full p-3 rounded-xl border border-border/40 bg-card/40 flex items-center gap-3 active:scale-[0.99] transition"
                >
                  <div className="text-xs font-bold w-7 text-center text-muted-foreground">{i + 4}</div>
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={r.profile?.avatar_url ?? undefined} />
                    <AvatarFallback>{(r.profile?.display_name ?? r.profile?.username ?? "?")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold truncate">{r.profile?.display_name ?? r.profile?.username ?? "Anonymous"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{r.total_predictions} calls · {r.accuracy_percentage.toFixed(1)}% · {r.current_streak}🔥</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {sort === "accuracy" ? `${r.accuracy_percentage.toFixed(1)}%` :
                       sort === "streak" ? `${r.best_streak}` :
                       r.reputation_points}
                    </p>
                    <Badge variant="outline" className={cn("text-[9px] mt-0.5", tierStyles[r.rank_tier] ?? tierStyles.Rookie)}>{r.rank_tier}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
