import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export const useRealTimeLikes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // Fetch user's liked posts
  useEffect(() => {
    if (!user) {
      setLikedPosts(new Set());
      return;
    }

    const fetchLikes = async () => {
      try {
        const { data } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id);

        if (data) {
          setLikedPosts(new Set(data.map(like => like.post_id)));
        }
      } catch (error) {
        console.error('Error fetching likes:', error);
      }
    };

    fetchLikes();

    // Subscribe to real-time like changes for this user
    const channel = supabase
      .channel(`likes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'likes',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setLikedPosts(prev => new Set(prev).add(payload.new.post_id));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'likes',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setLikedPosts(prev => {
            const newSet = new Set(prev);
            newSet.delete(payload.old.post_id);
            return newSet;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const toggleLike = async (postId: string) => {
    if (!user) {
      toast({
        title: 'Sign up to like posts',
        description: 'Create an account to interact with posts',
        action: (
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/auth'}>
            Sign Up
          </Button>
        ),
      });
      return;
    }

    const isLiked = likedPosts.has(postId);

    try {
      if (isLiked) {
        // Unlike — trigger maintains like_count
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like — trigger maintains like_count
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Failed to update like. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const isPostLiked = (postId: string) => likedPosts.has(postId);

  return { toggleLike, isPostLiked, likedPosts };
};