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
  // Handle both nested profile structure and direct join
  const profileData = supabasePost.profiles || supabasePost;
  
  const user: User = {
    id: supabasePost.user_id,
    username: profileData.username || 'user' + supabasePost.user_id.slice(-4),
    displayName: profileData.display_name || profileData.username || 'Unknown User',
    avatar: profileData.avatar_url || '',
    isVerified: false,
    followersCount: profileData.follower_count || 0,
    followingCount: profileData.following_count || 0,
    tradingLevel: 'Beginner',
    portfolioReturn: 0,
    winRate: 0
  };

  return {
    id: supabasePost.id,
    user,
    content: supabasePost.content,
    image: supabasePost.image_url,
    timestamp: new Date(supabasePost.created_at),
    likes: supabasePost.like_count || 0,
    comments: supabasePost.comment_count || 0,
    shares: 0,
    isLiked: false,
    type: 'text',
    tags: [],
    sentiment: 'neutral'
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

// Hook for fetching posts with real-time updates
export const usePosts = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Query posts and separately get profile data
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(username, display_name, avatar_url, follower_count, following_count)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Raw posts data:', data);
      
      // Transform Supabase posts to Social posts
      const transformedPosts = (data || []).map(transformSupabasePost);
      console.log('Transformed posts:', transformedPosts);
      
      setPosts(transformedPosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    // Simple realtime subscription for posts table
    const channel = supabase
      .channel('posts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('Realtime post change:', payload);
          
          if (payload.eventType === 'INSERT') {
            // For new posts, fetch the complete data with profile
            fetchPostWithProfile(payload.new.id).then(newPost => {
              if (newPost) {
                setPosts(prevPosts => [newPost, ...prevPosts]);
              }
            }).catch(err => console.error('Error fetching new post:', err));
          } else if (payload.eventType === 'UPDATE') {
            // Update existing post
            fetchPostWithProfile(payload.new.id).then(updatedPost => {
              if (updatedPost) {
                setPosts(prevPosts => 
                  prevPosts.map(post => 
                    post.id === updatedPost.id ? updatedPost : post
                  )
                );
              }
            }).catch(err => console.error('Error fetching updated post:', err));
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted post
            setPosts(prevPosts => 
              prevPosts.filter(post => post.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Helper function to fetch a single post with profile data
  const fetchPostWithProfile = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(username, display_name, avatar_url, follower_count, following_count)
        `)
        .eq('id', postId)
        .maybeSingle();

      if (error) throw error;
      return transformSupabasePost(data);
    } catch (err) {
      console.error('Error fetching post with profile:', err);
      return null;
    }
  };

  return { posts, loading, error, refetch: fetchPosts };
};

// This useProfile hook is replaced by the dedicated useProfile.tsx file

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

    try {
      // Check if already liked
      const { data: existingLike, error: checkError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);

        if (deleteError) throw deleteError;

        // Decrement like count using RPC function
        const { error: rpcError } = await supabase.rpc('decrement_post_likes', { post_id: postId });
        if (rpcError) throw rpcError;
      } else {
        // Like
        const { error: insertError } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        if (insertError) throw insertError;

        // Increment like count using RPC function
        const { error: rpcError } = await supabase.rpc('increment_post_likes', { post_id: postId });
        if (rpcError) throw rpcError;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  };

  const addComment = async (postId: string, content: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
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
      const { error: rpcError } = await supabase.rpc('increment_post_comments', { post_id: postId });
      if (rpcError) throw rpcError;

      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  return { createPost, likePost, addComment };
};
