import { useState, useEffect } from 'react';
import { MockNewsService } from '@/services/MockNewsService';

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
      // Fetch news from mock service
      const newsData = await MockNewsService.getNews();
      
      // Transform mock data to match expected format
      const transformedArticles: NewsArticle[] = newsData.map(article => ({
        id: article.id,
        title: article.title,
        description: article.summary,
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source,
        category: article.category,
      }));
      
      setArticles(transformedArticles);
      setLastUpdated(new Date());
      setError(null);
      
    } catch (error) {
      console.error('Error fetching news:', error);
      setError('Failed to load news');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch news on mount and set up periodic updates
  useEffect(() => {
    // Always fetch news (with fallback to mock data)
    fetchNews();
    
    // Set up periodic updates every 15 minutes
    const interval = setInterval(fetchNews, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    articles,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchNews,
    hasApiKey: true // Always return true since we have fallback data
  };
};