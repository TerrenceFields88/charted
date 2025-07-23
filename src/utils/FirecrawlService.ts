import { supabase } from '@/integrations/supabase/client';

interface ErrorResponse {
  success: false;
  error: string;
}

interface CrawlStatusResponse {
  success: true;
  status: string;
  completed: number;
  total: number;
  creditsUsed: number;
  expiresAt: string;
  data: any[];
}

type CrawlResponse = CrawlStatusResponse | ErrorResponse;

export class FirecrawlService {
  // Call the secure Edge Function instead of using client-side API
  static async callFirecrawlFunction(url: string, action: 'scrape' | 'crawl' = 'scrape') {
    try {
      console.log(`Calling Firecrawl Edge Function for ${action}:`, url);
      
      const { data, error } = await supabase.functions.invoke('firecrawl-scraper', {
        body: { url, action }
      });

      if (error) {
        console.error('Edge Function error:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to call Firecrawl service' 
        };
      }

      return data;
    } catch (error) {
      console.error('Error calling Firecrawl Edge Function:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to Firecrawl service' 
      };
    }
  }

  // Legacy methods for backward compatibility - now redirect to Edge Function
  static saveApiKey(apiKey: string): void {
    console.log('API key management is now handled securely through Supabase secrets');
    // API key is now managed through Supabase secrets, no need to store locally
  }

  static getApiKey(): string | null {
    // Always return truthy since API key is managed server-side
    return 'configured-in-supabase-secrets';
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      console.log('Testing API key through Edge Function');
      // Test by trying to scrape a simple page
      const result = await this.callFirecrawlFunction('https://example.com', 'scrape');
      return result.success;
    } catch (error) {
      console.error('Error testing API key:', error);
      return false;
    }
  }

  static async scrapeBloombergNews(): Promise<{ success: boolean; error?: string; data?: any }> {
    console.log('Scraping Bloomberg news through secure Edge Function');
    return await this.callFirecrawlFunction('https://www.bloomberg.com/markets', 'scrape');
  }

  static async crawlWebsite(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    console.log('Crawling website through secure Edge Function:', url);
    return await this.callFirecrawlFunction(url, 'crawl');
  }
}