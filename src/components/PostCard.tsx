import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Heart, MessageCircle, Share, MoreHorizontal, TrendingUp, TrendingDown, Minus, Trash2, Send, Repeat } from 'lucide-react';
import { Post } from '@/types/social';
import { useAuth } from '@/hooks/useAuth';
import { usePostActions } from '@/hooks/useSupabaseData';
import { useRealTimeLikes } from '@/hooks/useRealTimeLikes';
import { useToast } from '@/hooks/use-toast';
import { SharePostDialog } from '@/components/SharePostDialog';
import { RepostDialog } from '@/components/RepostDialog';
import { TradingViewMiniChart } from '@/components/TradingViewMiniChart';
import { CommentSection } from '@/components/CommentSection';
import { VideoPlayer } from '@/components/VideoPlayer';
import { cn } from '@/lib/utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { SafeZoneOverlay } from '@/components/SafeZoneOverlay';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';

interface PostCardProps {
  post: Post;
}

export const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuth();
  const { deletePost } = usePostActions();
  const { toggleLike, isPostLiked } = useRealTimeLikes();
  const { toast } = useToast();
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [repostDialogOpen, setRepostDialogOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [imageOpen, setImageOpen] = useState(false);

  const isLiked = isPostLiked(post.id);
  const isOwner = user && user.id === post.user.id;

  const handleLike = async () => {
    await toggleLike(post.id);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleDeletePost = async () => {
    if (!isOwner) return;
    try {
      setIsDeleting(true);
      await deletePost(post.id);
      toast({ title: 'Deleted', description: 'Post removed' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete post', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h`;
    return `${Math.floor(mins / 1440)}d`;
  };

  const getSentimentIcon = () => {
    switch (post.sentiment) {
      case 'bullish': return <TrendingUp className="w-3 h-3 text-success" />;
      case 'bearish': return <TrendingDown className="w-3 h-3 text-destructive" />;
      default: return <Minus className="w-3 h-3 text-warning" />;
    }
  };

  return (
    <Card className="overflow-hidden border-0 bg-card/50 rounded-xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-3 pb-2">
        <Link to={`/u/${post.user.username}`} className="flex items-center gap-2.5">
          <div className="relative">
            <Avatar className="w-9 h-9">
              <AvatarImage src={post.user.avatar} alt={post.user.displayName} />
              <AvatarFallback className="text-xs">{post.user.displayName[0]}</AvatarFallback>
            </Avatar>
            {post.user.isVerified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">{post.user.displayName}</span>
              <span className="text-[10px] text-muted-foreground">{formatTimeAgo(post.timestamp)}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {post.symbol && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 h-4">
                  {getSentimentIcon()}
                  ${post.symbol}
                </Badge>
              )}
            </div>
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50">
            <DropdownMenuItem onClick={() => setRepostDialogOpen(true)}>
              <Repeat className="w-3.5 h-3.5 mr-2" /> Repost
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
              <Send className="w-3.5 h-3.5 mr-2" /> Share via DM
            </DropdownMenuItem>
            {isOwner && (
              <DropdownMenuItem onClick={handleDeletePost} disabled={isDeleting} className="text-destructive focus:text-destructive">
                <Trash2 className="w-3.5 h-3.5 mr-2" /> {isDeleting ? 'Deleting…' : 'Delete'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="px-3 pb-2">
        <p className="text-sm leading-relaxed line-clamp-3">{post.content}</p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="text-[10px] text-primary">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Media */}
      {post.image && (
        <div
          className="relative mx-3 mb-2 overflow-hidden rounded-lg bg-muted cursor-zoom-in"
          onClick={() => setImageOpen(true)}
        >
          <AspectRatio ratio={4 / 5}>
            <img src={post.image} alt="" className="w-full h-full object-cover" />
          </AspectRatio>
          <SafeZoneOverlay />
          <SafeZoneOverlay />
          {post.type === 'chart' && (
            <Badge className="absolute top-2 left-2 bg-background/80 text-foreground text-[10px]">Chart</Badge>
          )}
        </div>
      )}

      {post.image && (
        <Dialog open={imageOpen} onOpenChange={setImageOpen}>
          <DialogContent className="max-w-[90vw] sm:max-w-3xl p-0 bg-card">
            <img src={post.image} alt="" className="w-full h-auto object-contain max-h-[85vh]" />
          </DialogContent>
        </Dialog>
      )}

      {post.symbol && (
        <div className="mx-3 mb-2 border rounded-lg overflow-hidden">
          <TradingViewMiniChart symbol={post.symbol} height={200} theme="light" />
        </div>
      )}

      {post.video && (
        <div className="relative mx-3 mb-2 overflow-hidden rounded-lg bg-muted">
          <AspectRatio ratio={4 / 5}>
            <VideoPlayer src={post.video} className="w-full h-full" controls poster={post.image} showSafeZone />
          </AspectRatio>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center px-3 py-2 border-t border-border/30">
        <button
          onClick={handleLike}
          className={cn(
            "flex items-center gap-1.5 mr-4 transition-all active:scale-90",
            isLiked ? "text-red-500" : "text-muted-foreground"
          )}
        >
          <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
          <span className="text-xs">{likeCount}</span>
        </button>

        <button className="flex items-center gap-1.5 text-muted-foreground mr-4">
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs">{commentCount}</span>
        </button>

        <button className="flex items-center gap-1.5 text-muted-foreground ml-auto" onClick={() => setShareDialogOpen(true)}>
          <Share className="w-4 h-4" />
        </button>
      </div>

      <CommentSection postId={post.id} commentCount={commentCount} onCommentCountChange={setCommentCount} />
      <SharePostDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} postId={post.id} />
      <RepostDialog open={repostDialogOpen} onOpenChange={setRepostDialogOpen} originalPost={post} />
    </Card>
  );
};
