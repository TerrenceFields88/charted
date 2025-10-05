interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  category: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export class MockNewsService {
  private static articles: NewsArticle[] = [
    {
      id: '1',
      title: 'Markets Rally on Strong Economic Data',
      summary: 'Stock markets surged today following better-than-expected jobs report and GDP growth figures, signaling continued economic strength.',
      url: 'https://example.com/market-rally',
      source: 'Financial Times',
      publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      category: 'markets',
      sentiment: 'positive',
    },
    {
      id: '2',
      title: 'Fed Officials Signal Rate Cut Possibility',
      summary: 'Federal Reserve officials hinted at potential interest rate cuts in upcoming meetings as inflation shows signs of cooling.',
      url: 'https://example.com/fed-rates',
      source: 'Bloomberg',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      category: 'economy',
      sentiment: 'positive',
    },
    {
      id: '3',
      title: 'Tech Stocks Lead Market Gains',
      summary: 'Major technology companies posted impressive quarterly earnings, driving the Nasdaq to new highs as investors remain optimistic about AI growth.',
      url: 'https://example.com/tech-stocks',
      source: 'CNBC',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      category: 'technology',
      sentiment: 'positive',
    },
    {
      id: '4',
      title: 'Gold Prices Surge to Record Highs',
      summary: 'Gold futures reached all-time highs as investors seek safe-haven assets amid global economic uncertainty.',
      url: 'https://example.com/gold-prices',
      source: 'Reuters',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      category: 'commodities',
      sentiment: 'neutral',
    },
    {
      id: '5',
      title: 'Oil Markets Stabilize After Volatility',
      summary: 'Crude oil prices found stability after weeks of fluctuation, with supply concerns easing following OPEC+ production announcements.',
      url: 'https://example.com/oil-markets',
      source: 'Wall Street Journal',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      category: 'commodities',
      sentiment: 'neutral',
    },
    {
      id: '6',
      title: 'Cryptocurrency Market Shows Resilience',
      summary: 'Bitcoin and major altcoins demonstrate strong recovery, with institutional adoption continuing to drive market sentiment.',
      url: 'https://example.com/crypto-market',
      source: 'CoinDesk',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      category: 'crypto',
      sentiment: 'positive',
    },
    {
      id: '7',
      title: 'European Markets Face Headwinds',
      summary: 'European stock indices declined as concerns over regional economic growth and energy prices weigh on investor confidence.',
      url: 'https://example.com/europe-markets',
      source: 'Financial Times',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      category: 'markets',
      sentiment: 'negative',
    },
    {
      id: '8',
      title: 'Housing Market Shows Signs of Cooling',
      summary: 'Home sales declined for the third consecutive month as higher mortgage rates continue to impact affordability.',
      url: 'https://example.com/housing-market',
      source: 'Bloomberg',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
      category: 'real-estate',
      sentiment: 'negative',
    },
  ];

  static async getNews(category?: string): Promise<NewsArticle[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (category) {
      return this.articles.filter(article => article.category === category);
    }
    
    return this.articles;
  }

  static async getArticle(id: string): Promise<NewsArticle | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.articles.find(article => article.id === id) || null;
  }

  static async searchNews(query: string): Promise<NewsArticle[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const lowerQuery = query.toLowerCase();
    return this.articles.filter(article => 
      article.title.toLowerCase().includes(lowerQuery) ||
      article.summary.toLowerCase().includes(lowerQuery)
    );
  }
}
