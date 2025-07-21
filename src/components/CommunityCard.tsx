import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, MessageCircle, Share } from 'lucide-react';
import { CommunityPost } from '@/types/social';
import { cn } from '@/lib/utils';

interface CommunityCardProps {
  post: CommunityPost;
}

export const CommunityCard = ({ post }: CommunityCardProps) => {
  const [isUpvoted, setIsUpvoted] = useState(post.isUpvoted);
  const [isDownvoted, setIsDownvoted] = useState(post.isDownvoted);
  const [upvotes, setUpvotes] = useState(post.upvotes);
  const [downvotes, setDownvotes] = useState(post.downvotes);

  const handleUpvote = () => {
    if (isUpvoted) {
      setIsUpvoted(false);
      setUpvotes(prev => prev - 1);
    } else {
      setIsUpvoted(true);
      setUpvotes(prev => prev + 1);
      if (isDownvoted) {
        setIsDownvoted(false);
        setDownvotes(prev => prev - 1);
      }
    }
  };

  const handleDownvote = () => {
    if (isDownvoted) {
      setIsDownvoted(false);
      setDownvotes(prev => prev - 1);
    } else {
      setIsDownvoted(true);
      setDownvotes(prev => prev + 1);
      if (isUpvoted) {
        setIsUpvoted(false);
        setUpvotes(prev => prev - 1);
      }
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getCategoryColor = () => {
    switch (post.category) {
      case 'analysis':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'discussion':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'news':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'question':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'strategy':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <Card className="mb-4 overflow-hidden border-0 shadow-sm bg-card">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex flex-col items-center gap-1 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUpvote}
              className={cn(
                "h-8 w-8 p-0",
                isUpvoted ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">
              {upvotes - downvotes}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownvote}
              className={cn(
                "h-8 w-8 p-0",
                isDownvoted ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn("text-xs capitalize", getCategoryColor())}>
                {post.category}
              </Badge>
              <span className="text-xs text-muted-foreground">{formatTimeAgo(post.timestamp)}</span>
            </div>
            
            <h3 className="font-semibold text-base mb-2 leading-tight">{post.title}</h3>
            
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              {post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content}
            </p>

            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {post.tags.map((tag) => (
                  <span key={tag} className="text-xs text-primary hover:text-primary/80 cursor-pointer">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={post.user.avatar} alt={post.user.displayName} />
                  <AvatarFallback className="text-xs">{post.user.displayName[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">u/{post.user.username}</span>
              </div>

              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  <span className="text-xs">{post.comments}</span>
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground">
                  <Share className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};