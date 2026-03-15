import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen, TrendingUp, TrendingDown, Target, Trophy,
  Clock, BarChart3, Check, X, Trash2
} from 'lucide-react';
import { useAISignals, AISignal } from '@/hooks/useAISignals';
import { useAuth } from '@/hooks/useAuth';

const statusFilters = ['all', 'pending', 'won', 'lost', 'cancelled'] as const;

const formatPrice = (price: number) => price >= 100 ? price.toFixed(2) : price.toFixed(4);

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-warning/15 text-warning border-warning/30';
    case 'won': return 'bg-success/15 text-success border-success/30';
    case 'lost': return 'bg-destructive/15 text-destructive border-destructive/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'LOW': return 'text-success';
    case 'MEDIUM': return 'text-warning';
    case 'HIGH': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
};

export const TradeJournalPage = () => {
  const { signals, stats, isLoading, updateSignalOutcome, deleteSignal } = useAISignals();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSignal, setSelectedSignal] = useState<AISignal | null>(null);
  const [exitPrice, setExitPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredSignals = signals.filter(s => statusFilter === 'all' || s.status === statusFilter);

  const handleUpdateOutcome = async (status: 'won' | 'lost' | 'cancelled') => {
    if (!selectedSignal) return;
    setIsUpdating(true);
    const success = await updateSignalOutcome(
      selectedSignal.id, status,
      exitPrice ? parseFloat(exitPrice) : undefined,
      notes || undefined
    );
    if (success) { setSelectedSignal(null); setExitPrice(''); setNotes(''); }
    setIsUpdating(false);
  };

  if (!user) {
    return (
      <div className="pb-20 px-4 py-12 flex flex-col items-center">
        <BookOpen className="w-10 h-10 text-muted-foreground mb-3" />
        <h2 className="text-lg font-bold mb-1">Trade Journal</h2>
        <p className="text-sm text-muted-foreground text-center">Sign in to track your AI signals</p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">Trade Journal</h1>
        </div>
      </div>

      <div className="px-4 py-3 space-y-4">
        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-20" /><Skeleton className="h-20" />
            <Skeleton className="h-20" /><Skeleton className="h-20" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <p className="text-xl font-bold text-primary">{stats.winRate.toFixed(0)}%</p>
              <p className="text-[10px] text-muted-foreground">Win Rate</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xl font-bold">{stats.totalSignals}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-success/10">
              <p className="text-xl font-bold text-success">+{stats.avgProfitPercent.toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground">Avg Win</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-destructive/10">
              <p className="text-xl font-bold text-destructive">-{stats.avgLossPercent.toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground">Avg Loss</p>
            </div>
          </div>
        ) : null}

        {/* Extra stats row */}
        {stats && !isLoading && (
          <div className="flex gap-2">
            <div className="flex-1 flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Profit Factor</p>
                <p className={`text-lg font-bold ${stats.profitFactor >= 1 ? 'text-success' : 'text-destructive'}`}>
                  {stats.profitFactor.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase">R:R</p>
                <p className="text-sm font-medium">
                  {stats.avgLossPercent > 0 ? `1:${(stats.avgProfitPercent / stats.avgLossPercent).toFixed(1)}` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                statusFilter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Signals */}
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
          </div>
        ) : filteredSignals.length === 0 ? (
          <div className="text-center py-10">
            <Target className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {statusFilter === 'all' ? 'No signals yet. Use AI Analyst to generate signals.' : `No ${statusFilter} signals.`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSignals.map((signal) => (
              <Card key={signal.id} className="bg-card/50">
                <CardContent className="p-3 space-y-2.5">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm">{signal.symbol}</span>
                      <Badge className={`text-[10px] px-1.5 py-0 ${signal.direction === 'LONG' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}`}>
                        {signal.direction}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getStatusStyle(signal.status)}`}>
                        {signal.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {signal.status === 'pending' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-6 text-[10px] px-2"
                              onClick={() => setSelectedSignal(signal)}>
                              Update
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Outcome</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                              <p className="text-sm">
                                {signal.symbol} {signal.direction} · Entry ${formatPrice(signal.entry_price)}
                              </p>
                              <div>
                                <label className="text-xs font-medium">Exit Price</label>
                                <Input type="number" placeholder="Optional" value={exitPrice}
                                  onChange={(e) => setExitPrice(e.target.value)} className="mt-1 h-9" />
                              </div>
                              <div>
                                <label className="text-xs font-medium">Notes</label>
                                <Input placeholder="Optional" value={notes}
                                  onChange={(e) => setNotes(e.target.value)} className="mt-1 h-9" />
                              </div>
                              <div className="flex gap-2">
                                <Button className="flex-1 bg-success hover:bg-success/90 h-9"
                                  onClick={() => handleUpdateOutcome('won')} disabled={isUpdating}>
                                  <Check className="w-3.5 h-3.5 mr-1" />Won
                                </Button>
                                <Button className="flex-1 bg-destructive hover:bg-destructive/90 h-9"
                                  onClick={() => handleUpdateOutcome('lost')} disabled={isUpdating}>
                                  <X className="w-3.5 h-3.5 mr-1" />Lost
                                </Button>
                                <Button variant="outline" className="h-9"
                                  onClick={() => handleUpdateOutcome('cancelled')} disabled={isUpdating}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <Button variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => deleteSignal(signal.id)}>
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  {/* Price levels */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="text-center py-1.5 rounded bg-muted/30">
                      <p className="text-[10px] text-muted-foreground">Entry</p>
                      <p className="text-xs font-semibold">${formatPrice(signal.entry_price)}</p>
                    </div>
                    <div className="text-center py-1.5 rounded bg-success/10">
                      <p className="text-[10px] text-muted-foreground">Target</p>
                      <p className="text-xs font-semibold text-success">${formatPrice(signal.target_price)}</p>
                    </div>
                    <div className="text-center py-1.5 rounded bg-destructive/10">
                      <p className="text-[10px] text-muted-foreground">Stop</p>
                      <p className="text-xs font-semibold text-destructive">${formatPrice(signal.stop_loss)}</p>
                    </div>
                  </div>

                  {/* Exit info */}
                  {signal.status !== 'pending' && signal.actual_exit_price && (
                    <div className="flex items-center justify-between px-2 py-1.5 rounded bg-muted/20 text-xs">
                      <span className="text-muted-foreground">Exit: ${formatPrice(signal.actual_exit_price)}</span>
                      {signal.profit_loss_percent !== null && (
                        <span className={`font-bold ${signal.profit_loss_percent >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {signal.profit_loss_percent >= 0 ? '+' : ''}{signal.profit_loss_percent.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(signal.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={getRiskColor(signal.risk_level)}>{signal.risk_level}</span>
                      <span>·</span>
                      <span>{signal.confidence}%</span>
                    </div>
                  </div>

                  {signal.notes && (
                    <p className="text-[10px] text-muted-foreground italic">Note: {signal.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
