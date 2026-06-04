import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Upload, Sparkles, TrendingUp, TrendingDown, Minus, Target, Shield, Loader2, ImageIcon, Trash2 } from "lucide-react";

interface Analysis {
  id: string;
  symbol: string | null;
  timeframe: string | null;
  image_url: string | null;
  bias: string;
  setup_name: string | null;
  trend: string | null;
  pattern: string | null;
  support_levels: number[];
  resistance_levels: number[];
  entry_price: number | null;
  stop_loss: number | null;
  target_price: number | null;
  risk_reward: number | null;
  confidence: number;
  timeframe_outlook: string | null;
  key_observations: string[];
  risks: string[];
  summary: string | null;
  created_at: string;
}

const COMMODITIES = ["Gold", "Silver", "Crude Oil", "Natural Gas", "Copper", "Corn", "Soybean", "Wheat"];
const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];

export const ChartAnalysisPage = () => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [symbol, setSymbol] = useState("");
  const [timeframe, setTimeframe] = useState("1h");
  const [notes, setNotes] = useState("");
  const [active, setActive] = useState<Analysis | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("chart_analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const onPick = (f: File) => {
    setFile(f);
    const r = new FileReader();
    r.onload = () => setPreview(r.result as string);
    r.readAsDataURL(f);
  };

  const toBase64 = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve((r.result as string).split(",")[1]);
      r.onerror = reject;
      r.readAsDataURL(f);
    });

  const analyze = async () => {
    if (!user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    if (!file) { toast({ title: "Pick a chart image first" }); return; }
    setAnalyzing(true);
    try {
      const image_base64 = await toBase64(file);
      const { data, error } = await supabase.functions.invoke("chart-analyzer", {
        body: { image_base64, symbol: symbol || undefined, timeframe, notes: notes || undefined },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Analysis complete", description: "AI has read your chart." });
      setActive((data as any).analysis);
      setFile(null); setPreview(null); setNotes("");
      await load();
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e?.message ?? "Try again", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const del = async (id: string) => {
    await supabase.from("chart_analyses").delete().eq("id", id);
    if (active?.id === id) setActive(null);
    await load();
  };

  const BiasIcon = ({ bias }: { bias: string }) =>
    bias === "long" ? <TrendingUp className="w-4 h-4 text-bullish" /> :
    bias === "short" ? <TrendingDown className="w-4 h-4 text-bearish" /> :
    <Minus className="w-4 h-4 text-muted-foreground" />;

  if (!user) {
    return (
      <div className="pb-24 px-4 pt-6">
        <Card className="p-6 text-center space-y-3">
          <Sparkles className="w-10 h-10 mx-auto text-primary" />
          <h2 className="font-display text-xl font-bold">AI Chart Analysis</h2>
          <p className="text-sm text-muted-foreground">Sign in to upload a chart and get instant AI-powered setup analysis.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen overflow-y-auto">
      <div className="sticky top-0 glass border-b hairline z-30 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-ember flex items-center justify-center shadow-ember">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight leading-none">Chart Analysis</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Upload → AI reads → trade plan</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Uploader */}
        <Card className="p-4 space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
          />
          {preview ? (
            <div className="relative rounded-xl overflow-hidden border hairline">
              <img src={preview} alt="Chart preview" className="w-full max-h-80 object-contain bg-muted/20" />
              <button
                onClick={() => { setPreview(null); setFile(null); }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-40 rounded-xl border-2 border-dashed hairline flex flex-col items-center justify-center gap-2 active:scale-[0.99] transition-transform bg-muted/10"
            >
              <Upload className="w-6 h-6 text-muted-foreground" />
              <p className="text-sm font-medium">Tap to upload chart</p>
              <p className="text-[10px] text-muted-foreground">PNG / JPG, any size</p>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">Symbol (optional)</option>
              {COMMODITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              {TIMEFRAMES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <Textarea
            placeholder="Optional context (your bias, news, position size)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-sm min-h-[60px]"
          />

          <Button
            onClick={analyze}
            disabled={analyzing || !file}
            className="w-full rounded-full"
          >
            {analyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing chart…</> : <><Sparkles className="w-4 h-4 mr-2" />Analyze with AI</>}
          </Button>
        </Card>

        {/* Active analysis result */}
        {active && <AnalysisCard a={active} BiasIcon={BiasIcon} />}

        {/* History */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1">Recent analyses</p>
          {loading ? (
            <>
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </>
          ) : history.length === 0 ? (
            <Card className="p-6 text-center">
              <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">No analyses yet. Upload a chart above.</p>
            </Card>
          ) : (
            history.map((a) => (
              <Card key={a.id} className="p-3 active:scale-[0.99] transition-transform">
                <button onClick={() => setActive(a)} className="w-full text-left">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <BiasIcon bias={a.bias} />
                      <span className="font-semibold text-sm">{a.symbol ?? "Chart"}</span>
                      {a.timeframe && <Badge variant="outline" className="text-[9px]">{a.timeframe}</Badge>}
                      {a.setup_name && <Badge variant="secondary" className="text-[9px]">{a.setup_name}</Badge>}
                    </div>
                    <Badge className="text-[9px]">{a.confidence}%</Badge>
                  </div>
                  {a.summary && <p className="text-xs text-muted-foreground line-clamp-2">{a.summary}</p>}
                </button>
                <div className="flex justify-end mt-1">
                  <button onClick={() => del(a.id)} className="text-[10px] text-muted-foreground hover:text-bearish">Delete</button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const AnalysisCard = ({ a, BiasIcon }: { a: Analysis; BiasIcon: any }) => (
  <Card className="p-4 space-y-3 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <BiasIcon bias={a.bias} />
        <span className="font-display font-bold uppercase text-sm tracking-wider">{a.bias}</span>
        {a.setup_name && <Badge variant="secondary" className="text-[10px]">{a.setup_name}</Badge>}
      </div>
      <Badge className="text-[10px]">{a.confidence}% confidence</Badge>
    </div>

    {a.summary && <p className="text-sm">{a.summary}</p>}

    <div className="grid grid-cols-3 gap-2 text-center">
      <Tile label="Entry" value={a.entry_price} />
      <Tile label="Stop" value={a.stop_loss} accent="bearish" />
      <Tile label="Target" value={a.target_price} accent="bullish" />
    </div>

    {(a.support_levels?.length > 0 || a.resistance_levels?.length > 0) && (
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Support</p>
          <div className="flex flex-wrap gap-1">
            {a.support_levels.map((s, i) => <Badge key={i} variant="outline" className="text-[10px] border-bullish/40 text-bullish">{s}</Badge>)}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Resistance</p>
          <div className="flex flex-wrap gap-1">
            {a.resistance_levels.map((s, i) => <Badge key={i} variant="outline" className="text-[10px] border-bearish/40 text-bearish">{s}</Badge>)}
          </div>
        </div>
      </div>
    )}

    {a.key_observations?.length > 0 && (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-primary" /><p className="text-[11px] uppercase tracking-wider font-semibold">Observations</p></div>
        <ul className="space-y-1 pl-5">
          {a.key_observations.map((o, i) => <li key={i} className="text-xs text-muted-foreground list-disc">{o}</li>)}
        </ul>
      </div>
    )}

    {a.risks?.length > 0 && (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-bearish" /><p className="text-[11px] uppercase tracking-wider font-semibold">Risks</p></div>
        <ul className="space-y-1 pl-5">
          {a.risks.map((o, i) => <li key={i} className="text-xs text-muted-foreground list-disc">{o}</li>)}
        </ul>
      </div>
    )}
  </Card>
);

const Tile = ({ label, value, accent }: { label: string; value: number | null; accent?: "bullish" | "bearish" }) => (
  <div className="rounded-lg p-2 bg-muted/30 border hairline">
    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className={`font-display font-bold text-sm ${accent === "bullish" ? "text-bullish" : accent === "bearish" ? "text-bearish" : ""}`}>
      {value != null ? value : "—"}
    </p>
  </div>
);
