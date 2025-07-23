import { useBloombergNews } from '@/hooks/useBloombergNews';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Newspaper, 
  ExternalLink, 
  Clock,
  TrendingUp,
  Wifi,
  WifiOff 
} from 'lucide-react';

interface NewsWidgetProps {
  maxArticles?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export const NewsWidget = ({ 
  maxArticles = 3, 
  showHeader = true, 
  compact = false 
}: NewsWidgetProps) => {
  const { articles, isLoading, error, lastUpdated, hasApiKey } = useBloombergNews();
  
  const displayArticles = articles.slice(0, maxArticles);

  if (!hasApiKey) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Newspaper className="w-4 h-4" />
            Bloomberg News
            <Badge variant="outline" className="ml-auto">
              Setup Required
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Configure Firecrawl API to see live news
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Newspaper className="w-4 h-4" />
            Bloomberg News
            <Badge variant={error ? "destructive" : "secondary"} className="ml-auto">
              {error ? (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  Live
                </>
              )}
            </Badge>
          </CardTitle>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Last updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </CardHeader>
      )}
      
      <CardContent className={showHeader ? "pt-0" : ""}>
        {isLoading && articles.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: maxArticles }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : displayArticles.length === 0 ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center mb-2">
              <Newspaper className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {error ? 'Failed to load news' : 'No news available'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayArticles.map((article) => (
              <div key={article.id} className="group">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors ${
                      compact ? 'text-sm' : 'text-sm'
                    }`}>
                      {article.title}
                    </h4>
                    {!compact && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {article.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {article.category || 'Markets'}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(article.publishedAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => window.open(article.url, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {articles.length > maxArticles && (
              <Button variant="outline" size="sm" className="w-full mt-3">
                <TrendingUp className="w-3 h-3 mr-1" />
                View All News
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};