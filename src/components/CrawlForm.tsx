import { useState } from 'react';
import { useToast } from "@/hooks/use-toast"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { FirecrawlService } from '@/utils/FirecrawlService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Globe } from 'lucide-react';

interface CrawlResult {
  success: boolean;
  status?: string;
  completed?: number;
  total?: number;
  creditsUsed?: number;
  expiresAt?: string;
  data?: any[];
}

export const CrawlForm = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('https://www.bloomberg.com/markets');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [crawlResult, setCrawlResult] = useState<CrawlResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    setCrawlResult(null);
    
    try {
      console.log('Starting crawl for URL:', url);
      const result = await FirecrawlService.crawlWebsite(url);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Website crawled successfully",
          duration: 3000,
        });
        setCrawlResult(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to crawl website",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error crawling website:', error);
      toast({
        title: "Error",
        description: "Failed to crawl website",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  const handleBloombergNewsScrape = async () => {
    setIsLoading(true);
    setProgress(0);
    setCrawlResult(null);
    
    try {
      const result = await FirecrawlService.scrapeBloombergNews();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Bloomberg news scraped successfully",
          duration: 3000,
        });
        setCrawlResult({ success: true, data: [result.data] });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to scrape Bloomberg news",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error scraping Bloomberg news:', error);
      toast({
        title: "Error",
        description: "Failed to scrape Bloomberg news",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  // Always show the main interface since API key is managed server-side
  return (
    <div className="space-y-6">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            News Scraper
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            API key is securely managed through Supabase
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={handleBloombergNewsScrape}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Scraping..." : "Get Latest Bloomberg News"}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or scrape custom URL</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                />
              </div>
              {isLoading && (
                <Progress value={progress} className="w-full" />
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                {isLoading ? "Crawling..." : "Start Crawl"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {crawlResult && (
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Crawl Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>Status: {crawlResult.status}</p>
              <p>Completed Pages: {crawlResult.completed}</p>
              <p>Total Pages: {crawlResult.total}</p>
              <p>Credits Used: {crawlResult.creditsUsed}</p>
              <p>Expires At: {new Date(crawlResult.expiresAt || '').toLocaleString()}</p>
              {crawlResult.data && (
                <div className="mt-4">
                  <p className="font-semibold mb-2">Crawled Data:</p>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
                    {JSON.stringify(crawlResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};