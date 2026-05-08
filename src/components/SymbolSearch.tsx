import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import { COMMODITIES, searchCommodities, type CommoditySymbol } from '@/lib/commodities';
import { useRealTimeMarketData } from '@/hooks/useRealTimeMarketData';
import { cn } from '@/lib/utils';

interface SymbolSearchProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (c: CommoditySymbol) => void;
  title?: string;
}

export const SymbolSearch = ({ open, onOpenChange, onSelect, title = 'Search commodities' }: SymbolSearchProps) => {
  const [q, setQ] = useState('');
  const { marketData } = useRealTimeMarketData();
  const results = useMemo(() => searchCommodities(q), [q]);

  const handleSelect = (c: CommoditySymbol) => {
    onSelect(c);
    onOpenChange(false);
    setQ('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-sm">{title}</DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Gold, CL, energy…"
              className="pl-9 h-10"
            />
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-2 pb-3">
          {results.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">No commodities match.</p>
          ) : (
            results.map((c) => {
              const md = marketData.find((m) => m.symbol === c.symbol);
              const up = (md?.changePercent ?? 0) >= 0;
              return (
                <button
                  key={c.symbol}
                  onClick={() => handleSelect(c)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted active:scale-[0.99] transition-all flex items-center gap-3"
                >
                  <span className="text-2xl flex-shrink-0">{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold leading-tight">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">{c.category} · {c.symbol}</div>
                  </div>
                  {md && (
                    <div className="text-right">
                      <div className="text-sm font-mono font-semibold">${md.price.toFixed(2)}</div>
                      <div className={cn('flex items-center justify-end gap-0.5 text-[10px]',
                        up ? 'text-success' : 'text-destructive')}>
                        {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        {up ? '+' : ''}{md.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Standalone trigger button used in headers
export const SymbolSearchButton = ({
  onSelect,
  className,
}: {
  onSelect: (c: CommoditySymbol) => void;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground text-xs transition-colors',
          className,
        )}
        aria-label="Search commodities"
      >
        <Search className="w-3.5 h-3.5" />
        Search
      </button>
      <SymbolSearch open={open} onOpenChange={setOpen} onSelect={onSelect} />
    </>
  );
};

export { COMMODITIES };
