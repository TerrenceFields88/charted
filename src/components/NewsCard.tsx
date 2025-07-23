import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Clock, TrendingUp } from 'lucide-react';

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

interface NewsCardProps {
  article: NewsArticle;
}

export const NewsCard = ({ article }: NewsCardProps) => {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg leading-tight line-clamp-2">
            {article.title}
          </CardTitle>
          {article.category && (
            <Badge variant="secondary" className="shrink-0">
              {article.category}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{formatTimeAgo(article.publishedAt)}</span>
          <span>•</span>
          <span className="font-medium">{article.source}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {article.imageUrl && (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <img 
              src={article.imageUrl} 
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        
        <p className="text-muted-foreground text-sm line-clamp-3">
          {article.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-bullish">
            <TrendingUp className="w-4 h-4" />
            <span>Market Impact</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(article.url, '_blank')}
            className="flex items-center gap-1"
          >
            Read More
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};