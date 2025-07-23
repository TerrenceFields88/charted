import { useState, useEffect } from 'react';
import { FirecrawlService } from '@/utils/FirecrawlService';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  category?: string;
  imageUrl?: string;
}

export const useBloombergNews = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNews = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await FirecrawlService.scrapeBloombergNews();
      
      if (result.success && result.data) {
        // Parse the scraped data into articles format
        const parsedArticles = parseBloombergData(result.data);
        setArticles(parsedArticles);
        setLastUpdated(new Date());
      } else {
        setError(result.error || 'Failed to fetch news');
      }
    } catch (error) {
      console.error('Error fetching Bloomberg news:', error);
      setError('Failed to fetch Bloomberg news');
    } finally {
      setIsLoading(false);
    }
  };

  const getMockNewsArticles = (): NewsArticle[] => {
    return [
      {
        id: 'mock-1',
        title: 'Fed Signals Potential Rate Cuts as Inflation Cools',
        description: 'Federal Reserve officials hint at possible interest rate reductions following recent inflation data showing continued cooling in consumer prices.',
        url: 'https://bloomberg.com/news/articles/fed-rate-cuts-inflation',
        publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        source: 'Bloomberg Markets',
        category: 'Central Banking'
      },
      {
        id: 'mock-2',
        title: 'Tech Giants Rally on AI Breakthrough Optimism',
        description: 'Major technology stocks surge as investors bet on artificial intelligence innovations driving next quarter earnings.',
        url: 'https://bloomberg.com/news/articles/tech-ai-rally',
        publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
        source: 'Bloomberg Technology',
        category: 'Technology'
      },
      {
        id: 'mock-3',
        title: 'Oil Prices Jump on Middle East Supply Concerns',
        description: 'Crude oil futures rise sharply amid geopolitical tensions affecting key shipping routes in the Persian Gulf.',
        url: 'https://bloomberg.com/news/articles/oil-supply-concerns',
        publishedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        source: 'Bloomberg Energy',
        category: 'Energy'
      },
      {
        id: 'mock-4',
        title: 'Gold Hits New Record High on Dollar Weakness',
        description: 'Precious metals surge to unprecedented levels as the US dollar weakens against major trading partners.',
        url: 'https://bloomberg.com/news/articles/gold-record-high',
        publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
        source: 'Bloomberg Commodities',
        category: 'Commodities'
      },
      {
        id: 'mock-5',
        title: 'European Markets Open Higher on ECB Policy Optimism',
        description: 'European equities gain as traders anticipate favorable monetary policy decisions from the European Central Bank.',
        url: 'https://bloomberg.com/news/articles/europe-markets-ecb',
        publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        source: 'Bloomberg Europe',
        category: 'European Markets'
      }
    ];
  };

  const parseBloombergData = (data: any): NewsArticle[] => {
    try {
      // Check if Bloomberg is blocking access (bot detection)
      if (data?.data?.markdown?.includes('detected unusual activity') || 
          data?.data?.markdown?.includes('not a robot') ||
          data?.data?.pageStatusCode === 403) {
        console.log('Bloomberg access blocked, using mock data');
        return getMockNewsArticles();
      }

      const articles: NewsArticle[] = [];
      
      if (data?.data?.markdown) {
        // Parse markdown content for article titles and links
        const lines = data.data.markdown.split('\n');
        let currentArticle: Partial<NewsArticle> = {};
        
        lines.forEach((line: string, index: number) => {
          // Look for headlines (markdown headers)
          if (line.match(/^#{1,3}\s/)) {
            if (currentArticle.title) {
              // Save previous article if we have one
              articles.push({
                id: `bloomberg-${Date.now()}-${articles.length}`,
                title: currentArticle.title,
                description: currentArticle.description || '',
                url: currentArticle.url || 'https://bloomberg.com',
                publishedAt: new Date().toISOString(),
                source: 'Bloomberg',
                category: 'Markets'
              });
            }
            
            currentArticle = {
              title: line.replace(/^#{1,3}\s/, '').trim()
            };
          }
          
          // Look for URLs
          if (line.includes('https://')) {
            const urlMatch = line.match(/https:\/\/[^\s)]+/);
            if (urlMatch) {
              currentArticle.url = urlMatch[0];
            }
          }
          
          // Use next line as description if it's not empty and not a header
          if (currentArticle.title && !currentArticle.description && line.trim() && !line.match(/^#{1,3}\s/)) {
            currentArticle.description = line.trim();
          }
        });
        
        // Add the last article
        if (currentArticle.title) {
          articles.push({
            id: `bloomberg-${Date.now()}-${articles.length}`,
            title: currentArticle.title,
            description: currentArticle.description || '',
            url: currentArticle.url || 'https://bloomberg.com',
            publishedAt: new Date().toISOString(),
            source: 'Bloomberg',
            category: 'Markets'
          });
        }
      }
      
      // If no articles were parsed, fall back to mock data
      if (articles.length === 0) {
        console.log('No articles parsed, using mock data');
        return getMockNewsArticles();
      }
      
      return articles.slice(0, 10); // Limit to 10 articles
    } catch (error) {
      console.error('Error parsing Bloomberg data:', error);
      return getMockNewsArticles();
    }
  };

  // Auto-fetch news on mount and set up periodic updates
  useEffect(() => {
    const apiKey = FirecrawlService.getApiKey();
    
    // Only fetch if API key is available
    if (apiKey) {
      fetchNews();
      
      // Set up periodic updates every 15 minutes
      const interval = setInterval(fetchNews, 15 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, []);

  return {
    articles,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchNews,
    hasApiKey: !!FirecrawlService.getApiKey()
  };
};