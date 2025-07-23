import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Post as SocialPost, User } from '@/types/social';

// Types for our data structures that align with Supabase
export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  created_at: string;
}

// Supabase post type with relations
interface SupabasePost {
  id: string;
  user_id: string;
  content: string;
  prediction_text?: string;
  prediction_confidence?: number;
  prediction_outcome?: string;
  image_url?: string;
  like_count: number;
  comment_count: number;
  community_id?: string;
  created_at: string;
  profiles?: Profile;
  communities?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

// Helper function to transform Supabase post to Social post
const transformSupabasePost = (supabasePost: any): SocialPost => {
  const profile = supabasePost.profiles;
  
  const user: User = {
    id: profile?.user_id || supabasePost.user_id,
    username: profile?.username || 'unknown',
    displayName: profile?.display_name || profile?.username || 'Unknown User',
    avatar: profile?.avatar_url || '',
    isVerified: false, // Default for now
    followersCount: profile?.follower_count || 0,
    followingCount: profile?.following_count || 0,
    tradingLevel: 'Beginner', // Default for now
    portfolioReturn: 0, // Default for now
    winRate: 0 // Default for now
  };

  return {
    id: supabasePost.id,
    user,
    content: supabasePost.content,
    image: supabasePost.image_url,
    timestamp: new Date(supabasePost.created_at),
    likes: supabasePost.like_count,
    comments: supabasePost.comment_count,
    shares: 0, // Default for now
    isLiked: false, // Will be determined by user context
    type: 'text', // Default for now
    tags: [], // Default for now
    sentiment: 'neutral' // Default for now
  };
};

export interface Market {
  id: string;
  title: string;
  description?: string;
  current_price?: number;
  price_change?: number;
  market_cap?: number;
  volume: number;
  created_at: string;
}

export interface Community {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  member_count: number;
  created_by: string;
  created_at: string;
}

// Hook for fetching posts
export const usePosts = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id (
              id,
              user_id,
              username,
              display_name,
              avatar_url,
              bio,
              follower_count,
              following_count,
              created_at
            ),
            communities:community_id (
              id,
              name,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Transform Supabase posts to Social posts
        const transformedPosts = (data || []).map(transformSupabasePost);
        setPosts(transformedPosts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();

    // Set up realtime subscription
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { posts, loading, error, refetch: () => window.location.reload() };
};

// Hook for fetching user profile
export const useProfile = (userId?: string) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [targetUserId]);

  return { profile, loading, error };
};

// Hook for fetching markets
export const useMarkets = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('markets')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMarkets(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  return { markets, loading, error };
};

// Hook for fetching communities
export const useCommunities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('communities')
          .select('*')
          .order('member_count', { ascending: false });

        if (error) throw error;
        setCommunities(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  return { communities, loading, error };
};

// Hook for post actions
export const usePostActions = () => {
  const { user } = useAuth();

  const createPost = async (content: string, predictionText?: string, confidence?: number, communityId?: string) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        content,
        prediction_text: predictionText,
        prediction_confidence: confidence,
        community_id: communityId,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const likePost = async (postId: string) => {
    if (!user) throw new Error('User not authenticated');

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingLike) {
      // Unlike
      await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      // Decrement like count using RPC function
      await supabase.rpc('decrement_post_likes', { post_id: postId });
    } else {
      // Like
      await supabase
        .from('likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      // Increment like count using RPC function
      await supabase.rpc('increment_post_likes', { post_id: postId });
    }
  };

  const addComment = async (postId: string, content: string) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        content,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Increment comment count using RPC function
    await supabase.rpc('increment_post_comments', { post_id: postId });

    return data;
  };

  return { createPost, likePost, addComment };
};