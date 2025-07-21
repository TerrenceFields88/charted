import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share, MoreHorizontal, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Post } from '@/types/social';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: Post;
}

export const PostCard = ({ post }: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getSentimentIcon = () => {
    switch (post.sentiment) {
      case 'bullish':
        return <TrendingUp className="w-4 h-4 text-bullish" />;
      case 'bearish':
        return <TrendingDown className="w-4 h-4 text-bearish" />;
      default:
        return <Minus className="w-4 h-4 text-neutral" />;
    }
  };

  const getTradingLevelColor = (level: string) => {
    switch (level) {
      case 'Pro':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'Advanced':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'Intermediate':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <Card className="mb-4 overflow-hidden border-0 shadow-sm bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.user.avatar} alt={post.user.displayName} />
              <AvatarFallback>{post.user.displayName[0]}</AvatarFallback>
            </Avatar>
            {post.user.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-primary-foreground rounded-full" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{post.user.displayName}</h3>
              <span className="text-xs text-muted-foreground">@{post.user.username}</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{formatTimeAgo(post.timestamp)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="secondary" 
                className={cn("text-xs px-2 py-0.5 text-white", getTradingLevelColor(post.user.tradingLevel))}
              >
                {post.user.tradingLevel}
              </Badge>
              {post.symbol && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 flex items-center gap-1">
                  {getSentimentIcon()}
                  ${post.symbol}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm leading-relaxed">{post.content}</p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs text-primary hover:text-primary/80 cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Media */}
      {post.image && (
        <div className="relative">
          <img 
            src={post.image} 
            alt="Post content" 
            className="w-full h-64 object-cover"
          />
          {post.type === 'chart' && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-background/80 text-foreground">
                Chart Analysis
              </Badge>
            </div>
          )}
        </div>
      )}

      {post.video && (
        <div className="relative bg-black">
          <div className="w-full h-64 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-2 mx-auto">
                <div className="w-0 h-0 border-l-8 border-r-0 border-t-6 border-b-6 border-l-white border-t-transparent border-b-transparent ml-1" />
              </div>
              <p className="text-sm">Trading Video</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={cn(
            "flex items-center gap-2 h-8 px-3",
            isLiked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
          <span className="text-xs font-medium">{likeCount}</span>
        </Button>

        <Button variant="ghost" size="sm" className="flex items-center gap-2 h-8 px-3 text-muted-foreground hover:text-foreground">
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs font-medium">{post.comments}</span>
        </Button>

        <Button variant="ghost" size="sm" className="flex items-center gap-2 h-8 px-3 text-muted-foreground hover:text-foreground">
          <Share className="w-4 h-4" />
          <span className="text-xs font-medium">{post.shares}</span>
        </Button>
      </div>
    </Card>
  );
};