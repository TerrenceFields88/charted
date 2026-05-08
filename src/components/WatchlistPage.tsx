import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bell, BellOff, Plus, Trash2, TrendingUp, TrendingDown, Star } from 'lucide-react';
import { useWatchlist, type AlertDirection } from '@/hooks/useWatchlist';
import { useRealTimeMarketData } from '@/hooks/useRealTimeMarketData';
import { COMMODITIES } from '@/lib/commodities';
import { SymbolSearch } from '@/components/SymbolSearch';
import { requestNotificationPermission, sendNotification } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export const WatchlistPage = () => {
  const { symbols, alerts, addSymbol, removeSymbol, addAlert, removeAlert } = useWatchlist();
  const { marketData } = useRealTimeMarketData();
  const [searchOpen, setSearchOpen] = useState(false);
  const [alertDialog, setAlertDialog] = useState<{ symbol: string; price: number } | null>(null);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertDir, setAlertDir] = useState<AlertDirection>('above');

  const items = symbols
    .map((s) => ({ commodity: COMMODITIES.find((c) => c.symbol === s)!, md: marketData.find((m) => m.symbol === s) }))
    .filter((i) => i.commodity);

  const enableAlerts = async () => {
    const ok = await requestNotificationPermission();
    if (ok) {
      sendNotification('Charted alerts on', 'You will get pinged when your prices hit.');
    } else {
      toast({ title: 'Permission denied', description: 'Enable notifications in your settings to get alerts.' });
    }
  };

  const openAlertDialog = (symbol: string, price: number) => {
    setAlertDialog({ symbol, price });
    setAlertPrice(price.toFixed(2));
    setAlertDir('above');
  };

  const submitAlert = () => {
    if (!alertDialog) return;
    const price = parseFloat(alertPrice);
    if (!price || price <= 0) {
      toast({ title: 'Invalid price', variant: 'destructive' }); return;
    }
    addAlert({ symbol: alertDialog.symbol, price, direction: alertDir });
    toast({ title: 'Alert set', description: `${alertDialog.symbol} ${alertDir} $${price}` });
    setAlertDialog(null);
  };

  return (
    <div className="pb-24 min-h-screen overflow-y-auto">
      <div className="sticky top-0 glass border-b border-border/50 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          <h1 className="text-lg font-bold tracking-tight">Watchlist</h1>
          <Badge variant="secondary" className="text-[10px]">{symbols.length}</Badge>
        </div>
        <Button size="sm" variant="ghost" onClick={enableAlerts} className="h-8 gap-1.5 text-xs">
          <Bell className="w-3.5 h-3.5" /> Enable alerts
        </Button>
      </div>

      <div className="px-4 pt-3 space-y-3">
        <Button onClick={() => setSearchOpen(true)} className="w-full gap-1.5">
          <Plus className="w-4 h-4" /> Add commodity
        </Button>

        {items.length === 0 ? (
          <Card className="p-6 text-center">
            <Star className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-semibold">Your watchlist is empty</p>
            <p className="text-xs text-muted-foreground mt-1">Add commodities to track prices and set alerts.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map(({ commodity: c, md }) => {
              const up = (md?.changePercent ?? 0) >= 0;
              const myAlerts = alerts.filter((a) => a.symbol === c.symbol);
              return (
                <Card key={c.symbol} className="p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground">{c.symbol}</div>
                    </div>
                    {md && (
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold">${md.price.toFixed(2)}</div>
                        <div className={cn('flex items-center justify-end gap-0.5 text-[10px]',
                          up ? 'text-success' : 'text-destructive')}>
                          {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                          {up ? '+' : ''}{md.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1"
                      onClick={() => md && openAlertDialog(c.symbol, md.price)}
                      disabled={!md}>
                      <Bell className="w-3 h-3" /> Add alert
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-[11px] text-destructive ml-auto"
                      onClick={() => removeSymbol(c.symbol)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  {myAlerts.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/40 space-y-1">
                      {myAlerts.map((a) => (
                        <div key={a.id} className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1">
                            <Bell className="w-3 h-3 text-primary" />
                            Notify when {a.direction} <span className="font-mono font-semibold">${a.price.toFixed(2)}</span>
                          </span>
                          <button onClick={() => removeAlert(a.id)} className="text-destructive hover:opacity-70">
                            <BellOff className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <SymbolSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelect={(c) => { addSymbol(c.symbol); toast({ title: 'Added', description: `${c.name} added to watchlist` }); }}
        title="Add to watchlist"
      />

      <Dialog open={!!alertDialog} onOpenChange={(o) => !o && setAlertDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Price alert</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant={alertDir === 'above' ? 'default' : 'outline'}
                onClick={() => setAlertDir('above')} className="gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Above
              </Button>
              <Button size="sm" variant={alertDir === 'below' ? 'default' : 'outline'}
                onClick={() => setAlertDir('below')} className="gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> Below
              </Button>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Trigger price ($)</label>
              <Input type="number" step="0.01" value={alertPrice} onChange={(e) => setAlertPrice(e.target.value)} />
            </div>
            <Button onClick={submitAlert} className="w-full">Set alert</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
