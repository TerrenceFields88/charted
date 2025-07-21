import { FutureContract } from '../types/futures';

export const mockFutures: FutureContract[] = [
  {
    symbol: 'GC',
    name: 'Gold Futures',
    price: 2035.40,
    change: 12.30,
    changePercent: 0.61,
    volume: 245680,
    openInterest: 456120,
    high24h: 2041.80,
    low24h: 2018.90,
    allTimeHigh: 2075.20,
    allTimeLow: 1160.50,
    momentum: 67,
    volatility: 1.2,
    prediction: {
      direction: 'bullish',
      confidence: 78,
      targetPrice: 2085.00,
      timeframe: '30 days',
      reasoning: 'Strong momentum with volume surge above 20-day average'
    }
  },
  {
    symbol: 'CL',
    name: 'Crude Oil WTI',
    price: 78.45,
    change: -1.23,
    changePercent: -1.54,
    volume: 892340,
    openInterest: 1234560,
    high24h: 80.12,
    low24h: 77.89,
    allTimeHigh: 147.27,
    allTimeLow: -37.63,
    momentum: -34,
    volatility: 2.8,
    prediction: {
      direction: 'bearish',
      confidence: 65,
      targetPrice: 72.50,
      timeframe: '14 days',
      reasoning: 'Inventory buildup with weakening demand signals'
    }
  },
  {
    symbol: 'SI',
    name: 'Silver Futures',
    price: 24.67,
    change: 0.89,
    changePercent: 3.74,
    volume: 178920,
    openInterest: 298740,
    high24h: 24.89,
    low24h: 23.45,
    allTimeHigh: 49.45,
    allTimeLow: 11.77,
    momentum: 45,
    volatility: 3.1,
    prediction: {
      direction: 'bullish',
      confidence: 72,
      targetPrice: 27.20,
      timeframe: '21 days',
      reasoning: 'Following gold trend with industrial demand increase'
    }
  },
  {
    symbol: 'HG',
    name: 'Copper Futures',
    price: 3.845,
    change: -0.032,
    changePercent: -0.82,
    volume: 156780,
    openInterest: 267890,
    high24h: 3.891,
    low24h: 3.823,
    allTimeHigh: 5.011,
    allTimeLow: 1.978,
    momentum: -12,
    volatility: 2.3,
    prediction: {
      direction: 'neutral',
      confidence: 55,
      targetPrice: 3.75,
      timeframe: '45 days',
      reasoning: 'Mixed signals from construction vs. tech demand'
    }
  },
  {
    symbol: 'ZC',
    name: 'Corn Futures',
    price: 485.25,
    change: 8.75,
    changePercent: 1.84,
    volume: 234560,
    openInterest: 892340,
    high24h: 488.50,
    low24h: 476.25,
    allTimeHigh: 846.75,
    allTimeLow: 323.00,
    momentum: 28,
    volatility: 1.9,
    prediction: {
      direction: 'bullish',
      confidence: 69,
      targetPrice: 510.00,
      timeframe: '60 days',
      reasoning: 'Weather concerns with strong export demand'
    }
  },
  {
    symbol: 'ZS',
    name: 'Soybean Futures',
    price: 1425.50,
    change: -15.25,
    changePercent: -1.06,
    volume: 198760,
    openInterest: 567890,
    high24h: 1445.75,
    low24h: 1418.00,
    allTimeHigh: 1765.00,
    allTimeLow: 856.50,
    momentum: -21,
    volatility: 2.1,
    prediction: {
      direction: 'bearish',
      confidence: 61,
      targetPrice: 1380.00,
      timeframe: '35 days',
      reasoning: 'Large harvest projections outweighing demand'
    }
  }
];

// Utility function to simulate real-time price updates
export const getUpdatedPrice = (basePrice: number, volatility: number): number => {
  const randomChange = (Math.random() - 0.5) * volatility * 2;
  return Number((basePrice + randomChange).toFixed(2));
};