import { useEffect, useRef, useState } from 'react';
import { useRealTimeMarketData } from '@/hooks/useRealTimeMarketData';
import { sendNotification } from '@/lib/notifications';
import { COMMODITIES } from '@/lib/commodities';

const WATCH_KEY = 'charted_watchlist_v1';
const ALERT_KEY = 'charted_watchlist_alerts_v1';
const FIRED_KEY = 'charted_watchlist_alerts_fired_v1';

export type AlertDirection = 'above' | 'below';

export interface PriceAlert {
  id: string;
  symbol: string;       // e.g. GC=F
  direction: AlertDirection;
  price: number;
  createdAt: number;
}

const load = <T,>(key: string, fallback: T): T => {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
};
const save = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} };

export const useWatchlist = () => {
  const [symbols, setSymbols] = useState<string[]>(() => load<string[]>(WATCH_KEY, []));
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => load<PriceAlert[]>(ALERT_KEY, []));
  const firedRef = useRef<Record<string, number>>(load<Record<string, number>>(FIRED_KEY, {}));
  const { marketData } = useRealTimeMarketData();

  useEffect(() => save(WATCH_KEY, symbols), [symbols]);
  useEffect(() => save(ALERT_KEY, alerts), [alerts]);

  // Check alerts whenever market data updates
  useEffect(() => {
    if (!marketData.length || !alerts.length) return;
    const fired = firedRef.current;
    const now = Date.now();

    alerts.forEach((a) => {
      const md = marketData.find((m) => m.symbol === a.symbol);
      if (!md) return;
      const lastFired = fired[a.id] || 0;
      // throttle: fire once per 10 minutes per alert
      if (now - lastFired < 10 * 60 * 1000) return;

      const triggered =
        (a.direction === 'above' && md.price >= a.price) ||
        (a.direction === 'below' && md.price <= a.price);

      if (triggered) {
        const c = COMMODITIES.find((x) => x.symbol === a.symbol);
        const name = c?.name || a.symbol;
        sendNotification(
          `${c?.emoji || '📈'} ${name} alert`,
          `Price is ${a.direction} $${a.price.toFixed(2)} — now $${md.price.toFixed(2)}`,
        );
        fired[a.id] = now;
        save(FIRED_KEY, fired);
      }
    });
  }, [marketData, alerts]);

  const addSymbol = (s: string) => {
    setSymbols((prev) => prev.includes(s) ? prev : [...prev, s]);
  };
  const removeSymbol = (s: string) => {
    setSymbols((prev) => prev.filter((x) => x !== s));
    setAlerts((prev) => prev.filter((a) => a.symbol !== s));
  };
  const isWatching = (s: string) => symbols.includes(s);

  const addAlert = (a: Omit<PriceAlert, 'id' | 'createdAt'>) => {
    const alert: PriceAlert = { ...a, id: crypto.randomUUID(), createdAt: Date.now() };
    setAlerts((prev) => [...prev, alert]);
    addSymbol(a.symbol);
    return alert;
  };
  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    const fired = { ...firedRef.current }; delete fired[id]; firedRef.current = fired; save(FIRED_KEY, fired);
  };

  return { symbols, alerts, addSymbol, removeSymbol, isWatching, addAlert, removeAlert };
};
