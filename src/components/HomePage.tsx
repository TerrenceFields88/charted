import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useRealTimeMarketData } from '@/hooks/useRealTimeMarketData';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Brain, LineChart, Image as ImageIcon, Target, Star, BookOpen, Newspaper,
  MessageCircle, Trophy, BookOpenCheck, TrendingUp, Bell, User, Activity, Wifi, ArrowUpRight, ArrowDownRight, Flame,
} from 'lucide-react';
import { COMMODITIES } from '@/lib/commodities';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface Tile {
  id: string;
  label: string;
  sub: string;
  icon: any;
  gradient: string;
  tab: string;
  badge?: string;
  authRequired?: boolean;
  featured?: boolean;
}

const TILES: Tile[] = [
  { id: 'chat', label: 'Ask AI', sub: 'Your trading copilot', icon: Sparkles, gradient: 'from-primary/30 via-primary/10 to-transparent', tab: 'chat', badge: 'LIVE', authRequired: true, featured: true },
  { id: 'analyst', label: 'AI Analyst', sub: 'Real-time signals', icon: Activity, gradient: 'from-amber-500/25 to-transparent', tab: 'analyst', authRequired: true },
  { id: 'coach', label: 'AI Coach', sub: 'Weekly reports', icon: Brain, gradient: 'from-fuchsia-500/20 to-transparent', tab: 'coach', authRequired: true },
  { id: 'chart-analysis', label: 'Chart Scan', sub: 'Upload a chart', icon: ImageIcon, gradient: 'from-sky-500/20 to-transparent', tab: 'chart-analysis', authRequired: true },
  { id: 'predictions', label: 'Predictions', sub: 'Call the move', icon: Target, gradient: 'from-emerald-500/20 to-transparent', tab: 'predictions' },
  { id: 'markets', label: 'Markets', sub: 'Futures board', icon: LineChart, gradient: 'from-primary/20 to-transparent', tab: 'markets' },
  { id: 'watchlist', label: 'Watchlist', sub: 'Your symbols', icon: Star, gradient: 'from-yellow-500/20 to-transparent', tab: 'watchlist', authRequired: true },
  { id: 'journal', label: 'Journal', sub: 'Log every trade', icon: BookOpenCheck, gradient: 'from-orange-500/20 to-transparent', tab: 'journal', authRequired: true },
  { id: 'leaderboard', label: 'Leaderboard', sub: 'Top traders', icon: Trophy, gradient: 'from-amber-400/25 to-transparent', tab: 'leaderboard' },
  { id: 'learn', label: 'Learn', sub: 'Curriculum', icon: BookOpen, gradient: 'from-violet-500/20 to-transparent', tab: 'learn' },
  { id: 'feed', label: 'Community', sub: 'Live feed', icon: Newspaper, gradient: 'from-rose-500/20 to-transparent', tab: 'feed' },
  { id: 'messages', label: 'Messages', sub: 'Trader DMs', icon: MessageCircle, gradient: 'from-cyan-500/20 to-transparent', tab: 'messages', authRequired: true },
];

export const HomePage = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { marketData, lastUpdated, isLoading } = useRealTimeMarketData();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [predictionCount, setPredictionCount] = useState(0);
  const [journalCount, setJournalCount] = useState(0);

  // Personal real-time signals
  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      const [{ count: p }, { count: t }] = await Promise.all([
        supabase.from('predictions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'open'),
        supabase.from('trades').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      if (!active) return;
      setPredictionCount(p ?? 0);
      setJournalCount(t ?? 0);
    };
    load();

    // Realtime: predictions + trades
    const ch = supabase
      .channel('home-personal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions', filter: `user_id=eq.${user.id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user.id}` }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => setUnread((u) => u + 1))
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [user?.id]);

  const liveCommodities = useMemo(() => {
    const map = new Map(marketData.map((m) => [m.symbol, m]));
    return COMMODITIES.map((c) => ({ ...c, live: map.get(c.symbol) }));
  }, [marketData]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return 'Burning the midnight oil';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Late session';
  })();

  const name = profile?.display_name || profile?.username || 'Trader';
  const initials = name.slice(0, 2).toUpperCase();

  const open = (t: Tile) => {
    if (t.authRequired && !user) {
      toast({ title: 'Sign in required', description: `Login to access ${t.label}.` });
      navigate('/auth');
      return;
    }
    onNavigate(t.tab);
  };

  return (
    <div className="pb-24 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 glass border-b border-border/40 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            className="w-10 h-10 ring-1 ring-primary/30 cursor-pointer active:scale-95 transition-transform"
            onClick={() => user ? onNavigate('profile') : navigate('/auth')}
          >
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-gradient-ember text-primary-foreground text-xs">
              {user ? initials : <User className="w-4 h-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{greeting}</p>
            <p className="font-display text-lg">{user ? name : 'Welcome to Charted'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="gap-1 text-[10px] border-emerald-500/40 text-emerald-400 bg-emerald-500/5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
          </Badge>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative" onClick={() => onNavigate('messages')}>
            <Bell className="w-4 h-4" />
            {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />}
          </Button>
        </div>
      </header>

      <div className="px-4 pt-5 space-y-6">
        {/* Hero — Ask AI */}
        <button
          onClick={() => open(TILES[0])}
          className="w-full text-left relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent p-5 active:scale-[0.99] transition-transform group"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] uppercase tracking-widest hover:bg-primary/20">AI Copilot</Badge>
              <h2 className="font-display text-2xl leading-tight">
                What's the trade<br/>
                <span className="font-display-italic text-gradient-gold">today?</span>
              </h2>
              <p className="text-xs text-muted-foreground">Ask anything — bias, sizing, psychology.</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-ember flex items-center justify-center shadow-ember shrink-0 group-active:rotate-6 transition-transform">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
        </button>

        {/* Live commodities strip */}
        <section>
          <div className="flex items-end justify-between mb-2.5">
            <div>
              <h3 className="font-display text-lg leading-none">Live tape</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : isLoading ? 'Connecting…' : '—'}
              </p>
            </div>
            <button onClick={() => onNavigate('markets')} className="text-[11px] text-primary flex items-center gap-1 active:scale-95">
              All markets <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-2 snap-x snap-mandatory scrollbar-none">
            {liveCommodities.map((c) => {
              const up = (c.live?.changePercent ?? 0) >= 0;
              return (
                <button
                  key={c.symbol}
                  onClick={() => onNavigate('markets')}
                  className="snap-start shrink-0 w-32 rounded-2xl border border-border/40 bg-card/50 backdrop-blur p-3 text-left active:scale-95 transition-transform hover:border-primary/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{c.emoji}</span>
                    {c.live ? (
                      up ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                    ) : <Wifi className="w-3 h-3 text-muted-foreground/40 animate-pulse" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2">{c.short}</p>
                  <p className="font-mono text-sm font-semibold mt-0.5">
                    {c.live ? c.live.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
                  </p>
                  <p className={cn('text-[10px] font-mono mt-0.5', up ? 'text-emerald-400' : 'text-red-400')}>
                    {c.live ? `${up ? '+' : ''}${c.live.changePercent.toFixed(2)}%` : '—'}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Personal stats */}
        {user && (
          <section className="grid grid-cols-3 gap-2">
            <Card className="p-3 bg-card/50 border-border/40 backdrop-blur">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Open calls</p>
              <p className="font-display text-2xl mt-1">{predictionCount}</p>
            </Card>
            <Card className="p-3 bg-card/50 border-border/40 backdrop-blur">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Trades</p>
              <p className="font-display text-2xl mt-1">{journalCount}</p>
            </Card>
            <Card className="p-3 bg-card/50 border-border/40 backdrop-blur">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Streak</p>
              <p className="font-display text-2xl mt-1 flex items-center gap-1">
                <Flame className="w-4 h-4 text-primary" />0
              </p>
            </Card>
          </section>
        )}

        {/* App grid */}
        <section>
          <h3 className="font-display text-lg mb-3">All tools</h3>
          <div className="grid grid-cols-3 gap-2.5">
            {TILES.slice(1).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => open(t)}
                  className="group relative aspect-square rounded-2xl border border-border/40 bg-card/40 backdrop-blur p-3 flex flex-col items-start justify-between text-left active:scale-95 transition-all hover:border-primary/40 hover:bg-card/70 overflow-hidden"
                >
                  <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60 group-hover:opacity-100 transition-opacity', t.gradient)} />
                  <div className="relative w-9 h-9 rounded-xl bg-background/60 border border-border/40 flex items-center justify-center backdrop-blur">
                    <Icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="relative">
                    <p className="text-xs font-semibold leading-tight">{t.label}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{t.sub}</p>
                  </div>
                  {t.badge && (
                    <span className="absolute top-2 right-2 text-[8px] font-bold tracking-widest text-primary bg-primary/15 px-1.5 py-0.5 rounded-full border border-primary/30">{t.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {!user && (
          <Card className="p-5 bg-gradient-to-br from-primary/10 to-transparent border-primary/30 text-center space-y-3">
            <h3 className="font-display text-xl">Personalize everything</h3>
            <p className="text-xs text-muted-foreground">Sign in to unlock AI memory, journal, watchlists & realtime alerts.</p>
            <Button onClick={() => navigate('/auth')} className="rounded-full bg-gradient-ember shadow-ember w-full">
              Sign in
            </Button>
          </Card>
        )}

        <p className="text-[9px] text-center text-muted-foreground/60 tracking-widest uppercase pt-2">
          Education only · Not financial advice
        </p>
      </div>
    </div>
  );
};
