import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Trophy, 
  XCircle, 
  Clock, 
  BarChart3, 
  Check, 
  X, 
  Trash2,
  Filter
} from 'lucide-react';
import { useAISignals, AISignal } from '@/hooks/useAISignals';
import { useAuth } from '@/hooks/useAuth';

const statusFilters = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
  { label: 'Cancelled', value: 'cancelled' },
];

export const TradeJournalPage = () => {
  const { signals, stats, isLoading, updateSignalOutcome, deleteSignal } = useAISignals();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSignal, setSelectedSignal] = useState<AISignal | null>(null);
  const [exitPrice, setExitPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredSignals = signals.filter(s => 
    statusFilter === 'all' || s.status === statusFilter
  );

  const formatPrice = (price: number) => {
    return price >= 100 ? price.toFixed(2) : price.toFixed(4);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'won': return 'bg-success text-success-foreground';
      case 'lost': return 'bg-destructive text-destructive-foreground';
      case 'cancelled': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'LONG' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-success';
      case 'MEDIUM': return 'text-warning';
      case 'HIGH': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const handleUpdateOutcome = async (status: 'won' | 'lost' | 'cancelled') => {
    if (!selectedSignal) return;
    setIsUpdating(true);
    
    const success = await updateSignalOutcome(
      selectedSignal.id,
      status,
      exitPrice ? parseFloat(exitPrice) : undefined,
      notes || undefined
    );
    
    if (success) {
      setSelectedSignal(null);
      setExitPrice('');
      setNotes('');
    }
    setIsUpdating(false);
  };

  if (!user) {
    return (
      <div className="pb-20 px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Trade Journal</h2>
            <p className="text-muted-foreground mb-4">
              Sign in to track your AI signals and performance
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Badge variant="outline" className="text-primary border-primary/50 bg-primary/10">
            <BookOpen className="w-3 h-3 mr-1" />
            Trade Journal
          </Badge>
        </div>
        <h1 className="text-2xl font-bold text-center">
          Your Trading <span className="text-primary">Performance</span>
        </h1>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-primary/10 border-primary/30">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-primary">
                  {stats.winRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className="text-xs text-muted-foreground">
                  {stats.wonSignals}W / {stats.lostSignals}L
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">{stats.totalSignals}</p>
                <p className="text-xs text-muted-foreground">Total Signals</p>
                <p className="text-xs text-warning">
                  {stats.pendingSignals} pending
                </p>
              </CardContent>
            </Card>

            <Card className="bg-success/10 border-success/30">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <p className="text-3xl font-bold text-success">
                  +{stats.avgProfitPercent.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground">Avg Win</p>
              </CardContent>
            </Card>

            <Card className="bg-destructive/10 border-destructive/30">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                </div>
                <p className="text-3xl font-bold text-destructive">
                  -{stats.avgLossPercent.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground">Avg Loss</p>
              </CardContent>
            </Card>

            <Card className="col-span-2 bg-muted/30">
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Profit Factor</p>
                  <p className={`text-2xl font-bold ${stats.profitFactor >= 1 ? 'text-success' : 'text-destructive'}`}>
                    {stats.profitFactor.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Risk/Reward</p>
                  <p className="text-sm">
                    {stats.avgLossPercent > 0 
                      ? `1:${(stats.avgProfitPercent / stats.avgLossPercent).toFixed(1)}`
                      : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(filter.value)}
              className="text-xs flex-shrink-0"
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Signals List */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : filteredSignals.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {statusFilter === 'all' 
                  ? 'No signals yet. Use the AI Analyst to generate trade signals.'
                  : `No ${statusFilter} signals found.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSignals.map((signal) => (
              <Card key={signal.id} className="bg-muted/30">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{signal.symbol}</span>
                      <Badge className={getDirectionColor(signal.direction)}>
                        {signal.direction}
                      </Badge>
                      <Badge className={getStatusColor(signal.status)}>
                        {signal.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {signal.status === 'pending' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedSignal(signal)}
                            >
                              Update
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Trade Outcome</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm font-medium mb-2">
                                  {signal.symbol} {signal.direction}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Entry: ${formatPrice(signal.entry_price)} | Target: ${formatPrice(signal.target_price)}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Exit Price (optional)</label>
                                <Input
                                  type="number"
                                  placeholder="Enter exit price"
                                  value={exitPrice}
                                  onChange={(e) => setExitPrice(e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Notes (optional)</label>
                                <Input
                                  placeholder="Add notes about this trade"
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  className="flex-1 bg-success hover:bg-success/90"
                                  onClick={() => handleUpdateOutcome('won')}
                                  disabled={isUpdating}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Won
                                </Button>
                                <Button 
                                  className="flex-1 bg-destructive hover:bg-destructive/90"
                                  onClick={() => handleUpdateOutcome('lost')}
                                  disabled={isUpdating}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Lost
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => handleUpdateOutcome('cancelled')}
                                  disabled={isUpdating}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteSignal(signal.id)}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 rounded bg-background/50">
                      <p className="text-xs text-muted-foreground">Entry</p>
                      <p className="font-semibold">${formatPrice(signal.entry_price)}</p>
                    </div>
                    <div className="text-center p-2 rounded bg-success/10">
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="font-semibold text-success">${formatPrice(signal.target_price)}</p>
                    </div>
                    <div className="text-center p-2 rounded bg-destructive/10">
                      <p className="text-xs text-muted-foreground">Stop</p>
                      <p className="font-semibold text-destructive">${formatPrice(signal.stop_loss)}</p>
                    </div>
                  </div>

                  {signal.status !== 'pending' && signal.actual_exit_price && (
                    <div className="flex items-center justify-between mb-3 p-2 rounded bg-background/50">
                      <span className="text-sm text-muted-foreground">Exit Price:</span>
                      <span className="font-semibold">${formatPrice(signal.actual_exit_price)}</span>
                      {signal.profit_loss_percent !== null && (
                        <span className={`font-bold ${signal.profit_loss_percent >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {signal.profit_loss_percent >= 0 ? '+' : ''}{signal.profit_loss_percent.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {new Date(signal.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={getRiskColor(signal.risk_level)}>{signal.risk_level} risk</span>
                      <span>•</span>
                      <span>{signal.confidence}% confidence</span>
                    </div>
                  </div>

                  {signal.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Note: {signal.notes}
                    </p>
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
