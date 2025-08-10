import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export const useRealTimeFollows = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followerIds, setFollowerIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch user's follows
  useEffect(() => {
    if (!user) {
      setFollowingIds(new Set());
      setFollowerIds(new Set());
      return;
    }

    const fetchFollows = async () => {
      try {
        setLoading(true);

        // Fetch users this user is following
        const { data: following } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        // Fetch users following this user
        const { data: followers } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', user.id);

        if (following) {
          setFollowingIds(new Set(following.map(f => f.following_id)));
        }

        if (followers) {
          setFollowerIds(new Set(followers.map(f => f.follower_id)));
        }
      } catch (error) {
        console.error('Error fetching follows:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollows();

    // Subscribe to real-time follow changes
    const channel = supabase
      .channel(`follows-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'follows',
          filter: `follower_id=eq.${user.id}`
        },
        (payload) => {
          setFollowingIds(prev => new Set(prev).add(payload.new.following_id));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'follows',
          filter: `follower_id=eq.${user.id}`
        },
        (payload) => {
          setFollowingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(payload.old.following_id);
            return newSet;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${user.id}`
        },
        (payload) => {
          setFollowerIds(prev => new Set(prev).add(payload.new.follower_id));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${user.id}`
        },
        (payload) => {
          setFollowerIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(payload.old.follower_id);
            return newSet;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const followUser = async (userId: string) => {
    if (!user) {
      toast({
        title: 'Sign up to follow users',
        description: 'Create an account to follow other traders',
        action: (
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/auth'}>
            Sign Up
          </Button>
        ),
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User followed successfully',
      });
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: 'Error',
        description: 'Failed to follow user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const unfollowUser = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User unfollowed successfully',
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast({
        title: 'Error',
        description: 'Failed to unfollow user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const isFollowing = (userId: string) => followingIds.has(userId);
  const isFollower = (userId: string) => followerIds.has(userId);

  return {
    followUser,
    unfollowUser,
    isFollowing,
    isFollower,
    followingIds,
    followerIds,
    loading
  };
};