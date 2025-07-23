import { FutureContract } from '../types/futures';

export const mockFutures: FutureContract[] = [
  {
    symbol: 'GC',
    name: 'Gold Futures',
    price: 2687.20,
    change: 18.40,
    changePercent: 0.69,
    volume: 345680,
    openInterest: 556120,
    high24h: 2695.80,
    low24h: 2668.90,
    allTimeHigh: 2875.20,
    allTimeLow: 1160.50,
    momentum: 72,
    volatility: 1.1,
    prediction: {
      direction: 'bullish',
      confidence: 81,
      targetPrice: 2750.00,
      timeframe: '30 days',
      reasoning: 'Central bank buying continues with geopolitical tensions supporting safe haven demand'
    }
  },
  {
    symbol: 'CL',
    name: 'Crude Oil WTI',
    price: 92.30,
    change: 1.45,
    changePercent: 1.59,
    volume: 1092340,
    openInterest: 1434560,
    high24h: 93.12,
    low24h: 90.89,
    allTimeHigh: 147.27,
    allTimeLow: -37.63,
    momentum: 38,
    volatility: 2.6,
    prediction: {
      direction: 'bullish',
      confidence: 72,
      targetPrice: 98.50,
      timeframe: '14 days',
      reasoning: 'OPEC+ production cuts with strong summer driving season demand'
    }
  },
  {
    symbol: 'SI',
    name: 'Silver Futures',
    price: 31.45,
    change: 1.23,
    changePercent: 4.07,
    volume: 278920,
    openInterest: 398740,
    high24h: 31.89,
    low24h: 30.15,
    allTimeHigh: 49.45,
    allTimeLow: 11.77,
    momentum: 58,
    volatility: 2.9,
    prediction: {
      direction: 'bullish',
      confidence: 78,
      targetPrice: 34.80,
      timeframe: '21 days',
      reasoning: 'Industrial demand surge from solar and EV sectors, following gold momentum'
    }
  },
  {
    symbol: 'HG',
    name: 'Copper Futures',
    price: 4.245,
    change: 0.067,
    changePercent: 1.60,
    volume: 256780,
    openInterest: 367890,
    high24h: 4.291,
    low24h: 4.178,
    allTimeHigh: 5.011,
    allTimeLow: 1.978,
    momentum: 42,
    volatility: 2.1,
    prediction: {
      direction: 'bullish',
      confidence: 68,
      targetPrice: 4.55,
      timeframe: '45 days',
      reasoning: 'Infrastructure spending acceleration with supply constraints from major producers'
    }
  },
  {
    symbol: 'ZC',
    name: 'Corn Futures',
    price: 542.75,
    change: 12.50,
    changePercent: 2.36,
    volume: 334560,
    openInterest: 992340,
    high24h: 545.50,
    low24h: 530.25,
    allTimeHigh: 846.75,
    allTimeLow: 323.00,
    momentum: 35,
    volatility: 1.8,
    prediction: {
      direction: 'bullish',
      confidence: 74,
      targetPrice: 575.00,
      timeframe: '60 days',
      reasoning: 'Drought concerns in key growing regions with biofuel demand increasing'
    }
  },
  {
    symbol: 'ZS',
    name: 'Soybean Futures',
    price: 1567.25,
    change: 22.75,
    changePercent: 1.47,
    volume: 298760,
    openInterest: 667890,
    high24h: 1575.75,
    low24h: 1544.00,
    allTimeHigh: 1765.00,
    allTimeLow: 856.50,
    momentum: 28,
    volatility: 2.0,
    prediction: {
      direction: 'bullish',
      confidence: 66,
      targetPrice: 1625.00,
      timeframe: '35 days',
      reasoning: 'Strong export demand from Asia offsetting increased US production'
    }
  }
];

// Utility function to simulate real-time price updates
export const getUpdatedPrice = (basePrice: number, volatility: number): number => {
  const randomChange = (Math.random() - 0.5) * volatility * 2;
  return Number((basePrice + randomChange).toFixed(2));
};