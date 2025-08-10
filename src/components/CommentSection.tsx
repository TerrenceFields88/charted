import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useRealTimeComments } from '@/hooks/useRealTimeComments';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Reply, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  parent_id: string | null;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  replies?: Comment[];
}

interface CommentSectionProps {
  postId: string;
  commentCount: number;
  onCommentCountChange: (count: number) => void;
}

export const CommentSection = ({ postId, commentCount, onCommentCountChange }: CommentSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { comments, loading: commentsLoading, refetch } = useRealTimeComments(showComments ? postId : '');


  const handleAddComment = async (content: string, parentId: string | null = null) => {
    if (!user || !content.trim()) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          content: content.trim(),
          user_id: user.id,
          parent_id: parentId,
        })
        .select()
        .single();

      if (error) throw error;

      // Increment comment count
      const { error: rpcError } = await supabase.rpc('increment_post_comments', { post_id: postId });
      if (rpcError) throw rpcError;

      // Reset form
      if (parentId) {
        setReplyText('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }

      // Update comment count
      onCommentCountChange(commentCount + 1);
      
      // Refresh comments
      refetch();

      toast({
        title: 'Success',
        description: parentId ? 'Reply added successfully' : 'Comment added successfully',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={cn("flex gap-3", isReply && "ml-10")}>
      <Avatar className="w-8 h-8">
        <AvatarImage src={comment.profiles.avatar_url} />
        <AvatarFallback>{comment.profiles.display_name?.[0] || comment.profiles.username[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.profiles.display_name || comment.profiles.username}</span>
            <span className="text-xs text-muted-foreground">@{comment.profiles.username}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.created_at)}</span>
          </div>
          <p className="text-sm">{comment.content}</p>
        </div>
        
        {!isReply && user && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
          >
            <Reply className="w-3 h-3 mr-1" />
            Reply
          </Button>
        )}

        {replyingTo === comment.id && (
          <div className="flex gap-2 mt-2">
            <Textarea
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[60px] text-sm"
            />
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                onClick={() => handleAddComment(replyText, comment.id)}
                disabled={loading || !replyText.trim()}
              >
                <Send className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-3 mt-3">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="border-t border-border/50">
      {/* Comments Toggle */}
      <div className="px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 h-8 px-3 text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs font-medium">{commentCount}</span>
          <span className="text-xs">{showComments ? 'Hide comments' : 'View comments'}</span>
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 space-y-4">
          {/* Add Comment */}
          {user ? (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>{user.email?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => handleAddComment(newComment)}
                  disabled={loading || !newComment.trim()}
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Sign up to join the conversation</p>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/auth'}>
                Create Account
              </Button>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
            {comments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};