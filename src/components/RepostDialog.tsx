import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Repeat, Quote } from 'lucide-react';
import { Post } from '@/types/social';
import { PostCard } from '@/components/PostCard';

interface RepostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalPost: Post;
}

export const RepostDialog = ({ open, onOpenChange, originalPost }: RepostDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [repostType, setRepostType] = useState<'simple' | 'quote'>('simple');

  const handleRepost = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const repostContent = repostType === 'quote' && comment.trim() 
        ? comment.trim() 
        : `Reposted from @${originalPost.user.username}`;

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: repostContent,
          // Note: We'll store the reference in content for now
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: repostType === 'quote' ? 'Quote posted successfully!' : 'Reposted successfully!',
      });

      setComment('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error reposting:', error);
      toast({
        title: 'Error',
        description: 'Failed to repost',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Repost</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Repost Type Selection */}
          <div className="flex gap-2">
            <Button
              variant={repostType === 'simple' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRepostType('simple')}
              className="flex-1"
            >
              <Repeat className="w-4 h-4 mr-2" />
              Repost
            </Button>
            <Button
              variant={repostType === 'quote' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRepostType('quote')}
              className="flex-1"
            >
              <Quote className="w-4 h-4 mr-2" />
              Quote
            </Button>
          </div>

          {/* Quote Comment */}
          {repostType === 'quote' && (
            <div className="space-y-2">
              <Label htmlFor="comment">Add your comment</Label>
              <Textarea
                id="comment"
                placeholder="What's your take on this?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={280}
              />
              <p className="text-xs text-muted-foreground text-right">
                {comment.length}/280
              </p>
            </div>
          )}

          {/* Original Post Preview */}
          <div className="border rounded-lg p-3 bg-muted/30 overflow-auto flex-1">
            <p className="text-sm text-muted-foreground mb-2">
              {repostType === 'quote' ? 'Quoting this post:' : 'Reposting:'}
            </p>
            <div className="scale-95 origin-top">
              <PostCard post={originalPost} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleRepost}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Posting...' : 
               repostType === 'quote' ? 'Quote Post' : 'Repost'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};