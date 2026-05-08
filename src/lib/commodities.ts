export interface CommoditySymbol {
  symbol: string;     // futures symbol e.g. GC=F
  name: string;
  short: string;      // GOLD
  emoji: string;
  category: 'metals' | 'energy' | 'agriculture';
  tvSymbol: string;   // TradingView symbol
}

export const COMMODITIES: CommoditySymbol[] = [
  { symbol: 'GC=F', name: 'Gold',        short: 'GOLD',  emoji: '🥇', category: 'metals',      tvSymbol: 'COMEX:GC1!' },
  { symbol: 'SI=F', name: 'Silver',      short: 'SILV',  emoji: '⚪', category: 'metals',      tvSymbol: 'COMEX:SI1!' },
  { symbol: 'HG=F', name: 'Copper',      short: 'COPPER',emoji: '🔶', category: 'metals',      tvSymbol: 'COMEX:HG1!' },
  { symbol: 'CL=F', name: 'Crude Oil',   short: 'CRUDE', emoji: '🛢️', category: 'energy',      tvSymbol: 'NYMEX:CL1!' },
  { symbol: 'NG=F', name: 'Natural Gas', short: 'NATGAS',emoji: '🔥', category: 'energy',      tvSymbol: 'NYMEX:NG1!' },
  { symbol: 'ZC=F', name: 'Corn',        short: 'CORN',  emoji: '🌽', category: 'agriculture', tvSymbol: 'CBOT:ZC1!' },
  { symbol: 'ZS=F', name: 'Soybean',     short: 'SOY',   emoji: '🫘', category: 'agriculture', tvSymbol: 'CBOT:ZS1!' },
  { symbol: 'ZW=F', name: 'Wheat',       short: 'WHEAT', emoji: '🌾', category: 'agriculture', tvSymbol: 'CBOT:ZW1!' },
];

export const findCommodity = (q: string): CommoditySymbol | undefined => {
  const s = q.toUpperCase().trim();
  return COMMODITIES.find((c) =>
    c.symbol === s || c.short === s || c.name.toUpperCase() === s,
  );
};

export const searchCommodities = (q: string): CommoditySymbol[] => {
  const s = q.toLowerCase().trim();
  if (!s) return COMMODITIES;
  return COMMODITIES.filter((c) =>
    c.symbol.toLowerCase().includes(s) ||
    c.short.toLowerCase().includes(s) ||
    c.name.toLowerCase().includes(s) ||
    c.category.includes(s),
  );
};
