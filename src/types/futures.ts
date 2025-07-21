export interface FutureContract {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  openInterest: number;
  high24h: number;
  low24h: number;
  allTimeHigh: number;
  allTimeLow: number;
  momentum: number; // -100 to 100
  volatility: number;
  prediction: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number; // 0 to 100
    targetPrice: number;
    timeframe: string;
    reasoning: string;
  };
}

export interface MarketData {
  timestamp: number;
  price: number;
  volume: number;
}