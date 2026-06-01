import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Brain, Sparkles, Target, AlertTriangle, Heart, CheckCircle2, TrendingUp, Loader2 } from "lucide-react";

interface CoachReport {
  id: string;
  headline: string;
  summary: string;
  strengths: string[];
  mistakes: string[];
  emotional_insights: string[];
  focus_tasks: string[];
  discipline_score: number;
  consistency_score: number;
  risk_mgmt_score: number;
  overall_rating: number;
  tier: string;
  report_type: string;
  created_at: string;
}

interface TraderDna {
  archetype: string;
  archetype_confidence: number;
  strengths: string[];
  weaknesses: string[];
  biases: string[];
  best_session: string | null;
  worst_session: string | null;
  recommended_strategies: string[];
  summary: string | null;
  last_calculated_at: string;
}

export const AICoachPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<CoachReport | null>(null);
  const [dna, setDna] = useState<TraderDna | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [r, d] = await Promise.all([
      supabase.from("ai_coach_reports").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("trader_dna").select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    setReport((r.data as any) ?? null);
    setDna((d.data as any) ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const generate = async (reportType: "daily" | "weekly" | "monthly" = "weekly") => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-coach", { body: { reportType } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Report ready", description: "Your AI coach has analyzed your activity." });
      await load();
    } catch (e: any) {
      toast({ title: "Coaching failed", description: e?.message ?? "Try again later", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (!user) {
    return (
      <div className="pb-24 px-4 pt-6">
        <Card className="p-6 text-center space-y-3">
          <Brain className="w-10 h-10 mx-auto text-primary" />
          <h2 className="font-display text-xl font-bold">AI Coach</h2>
          <p className="text-sm text-muted-foreground">Log in to get personalized trading insights and your Trader DNA profile.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen overflow-y-auto">
      <div className="sticky top-0 glass border-b hairline z-30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-ember flex items-center justify-center shadow-ember">
            <Brain className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight leading-none">AI Coach</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Powered by Charted AI</p>
          </div>
        </div>
        <Button size="sm" onClick={() => generate("weekly")} disabled={generating} className="rounded-full">
          {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analyzing</> : <><Sparkles className="w-3.5 h-3.5" />Run Weekly</>}
        </Button>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </>
        ) : (
          <>
            {/* Trader DNA */}
            <Card className="p-4 space-y-3 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h2 className="font-display font-bold text-sm uppercase tracking-wider">Trader DNA</h2>
                </div>
                {dna && <Badge variant="secondary" className="text-[10px]">{dna.archetype_confidence}% confidence</Badge>}
              </div>
              {dna ? (
                <>
                  <div>
                    <p className="text-2xl font-display font-bold">{dna.archetype}</p>
                    {dna.summary && <p className="text-sm text-muted-foreground mt-1">{dna.summary}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {dna.best_session && (
                      <div><p className="text-muted-foreground">Best session</p><p className="font-semibold">{dna.best_session}</p></div>
                    )}
                    {dna.worst_session && (
                      <div><p className="text-muted-foreground">Worst session</p><p className="font-semibold">{dna.worst_session}</p></div>
                    )}
                  </div>
                  {dna.recommended_strategies?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Recommended</p>
                      <div className="flex flex-wrap gap-1.5">
                        {dna.recommended_strategies.map((s, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Run your first analysis to discover your trading archetype.</p>
              )}
            </Card>

            {/* Coach report */}
            {report ? (
              <Card className="p-4 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] uppercase">{report.report_type} report</Badge>
                    <Badge className="text-[10px]">{report.tier}</Badge>
                  </div>
                  <h2 className="font-display text-lg font-bold leading-tight">{report.headline}</h2>
                  <p className="text-sm text-muted-foreground">{report.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <ScoreTile label="Discipline" value={report.discipline_score} />
                  <ScoreTile label="Consistency" value={report.consistency_score} />
                  <ScoreTile label="Risk Mgmt" value={report.risk_mgmt_score} />
                  <ScoreTile label="Overall" value={report.overall_rating} highlight />
                </div>

                <Section icon={<CheckCircle2 className="w-3.5 h-3.5 text-bullish" />} title="Strengths" items={report.strengths} />
                <Section icon={<AlertTriangle className="w-3.5 h-3.5 text-bearish" />} title="Mistakes" items={report.mistakes} />
                <Section icon={<Heart className="w-3.5 h-3.5 text-accent" />} title="Emotional insights" items={report.emotional_insights} />
                <Section icon={<Target className="w-3.5 h-3.5 text-primary" />} title="Focus this week" items={report.focus_tasks} />
              </Card>
            ) : (
              <Card className="p-6 text-center space-y-2">
                <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium">No reports yet</p>
                <p className="text-xs text-muted-foreground">Tap "Run Weekly" above to generate your first AI coaching report based on your recent trades and predictions.</p>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const ScoreTile = ({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) => (
  <div className={`rounded-xl p-3 border ${highlight ? "bg-gradient-ember text-primary-foreground border-transparent" : "bg-muted/30"}`}>
    <p className={`text-[10px] uppercase tracking-wider ${highlight ? "opacity-80" : "text-muted-foreground"}`}>{label}</p>
    <p className="font-display text-2xl font-bold leading-none mt-1">{value}</p>
  </div>
);

const Section = ({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) => {
  if (!items?.length) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-[11px] uppercase tracking-wider font-semibold">{title}</p>
      </div>
      <ul className="space-y-1 pl-5">
        {items.map((it, i) => (
          <li key={i} className="text-xs text-muted-foreground list-disc">{it}</li>
        ))}
      </ul>
    </div>
  );
};
