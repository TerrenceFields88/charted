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

  const parseBloombergData = (data: any): NewsArticle[] => {
    // Extract article information from scraped Bloomberg data
    // This is a simplified parser - in production you'd want more robust parsing
    try {
      const articles: NewsArticle[] = [];
      
      if (data.markdown) {
        // Parse markdown content for article titles and links
        const lines = data.markdown.split('\n');
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
      
      return articles.slice(0, 10); // Limit to 10 articles
    } catch (error) {
      console.error('Error parsing Bloomberg data:', error);
      return [];
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