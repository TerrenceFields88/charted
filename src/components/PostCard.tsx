import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Heart, MessageCircle, Share, MoreHorizontal, TrendingUp, TrendingDown, Minus, Trash2, Send } from 'lucide-react';
import { Post } from '@/types/social';
import { useAuth } from '@/hooks/useAuth';
import { usePostActions } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';
import { SharePostDialog } from '@/components/SharePostDialog';
import { TradingViewMiniChart } from '@/components/TradingViewChart';
import { CommentSection } from '@/components/CommentSection';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: Post;
}

export const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuth();
  const { deletePost } = usePostActions();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleDeletePost = async () => {
    if (!user || user.id !== post.user.id) {
      toast({
        title: 'Error',
        description: 'You can only delete your own posts',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsDeleting(true);
      await deletePost(post.id);
      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Check if current user owns this post
  const isOwner = user && user.id === post.user.id;

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
              <Send className="w-4 h-4 mr-2" />
              Share via DM
            </DropdownMenuItem>
            {isOwner && (
              <DropdownMenuItem 
                onClick={handleDeletePost}
                disabled={isDeleting}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete Post'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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

      {/* TradingView Chart */}
      {post.symbol && (
        <div className="mx-4 mb-4">
          <div className="border rounded-lg overflow-hidden">
            <TradingViewMiniChart
              symbol={post.symbol}
              height={250}
              theme="light"
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <Badge variant="outline" className="text-xs">
              Chart: {post.symbol}
            </Badge>
          </div>
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
          <Share className="w-4 h-4" />
          <span className="text-xs font-medium">{post.shares}</span>
        </Button>
      </div>

      {/* Comments Section */}
      <CommentSection 
        postId={post.id}
        commentCount={commentCount}
        onCommentCountChange={setCommentCount}
      />

      {/* Share Post Dialog */}
      <SharePostDialog 
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        postId={post.id}
      />
    </Card>
  );
};