import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CommunityPost, User } from '@/types/social';
import { Profile } from '@/hooks/useSupabaseData';

// Transform Supabase post to CommunityPost format
const transformToCommunityPost = (supabasePost: any): CommunityPost => {
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
    title: supabasePost.prediction_text || supabasePost.content.slice(0, 50) + '...',
    content: supabasePost.content,
    user,
    timestamp: new Date(supabasePost.created_at),
    upvotes: supabasePost.like_count || 0,
    downvotes: 0,
    comments: supabasePost.comment_count || 0,
    category: 'discussion', // Default category
    tags: [],
    isUpvoted: false,
    isDownvoted: false
  };
};

export const useCommunityPosts = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunityPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all posts (community posts are regular posts)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Supabase posts error:', postsError);
        throw postsError;
      }
      
      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Get unique user IDs from posts
      const userIds = [...new Set(postsData.map(post => post.user_id))];
      
      // Fetch profiles for these user IDs
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, follower_count, following_count')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Supabase profiles error:', profilesError);
      }
      
      // Create a map of user_id to profile
      const profileMap = new Map();
      (profilesData || []).forEach(profile => {
        profileMap.set(profile.user_id, profile);
      });
      
      // Combine posts with their profile data
      const postsWithProfiles = postsData.map(post => ({
        ...post,
        profiles: profileMap.get(post.user_id) || null
      }));
      
      // Transform to CommunityPost format
      const transformedPosts = postsWithProfiles.map(transformToCommunityPost);
      setPosts(transformedPosts);
    } catch (err) {
      console.error('Error fetching community posts:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityPosts();

    // Real-time subscription for posts
    const channel = supabase
      .channel('community-posts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('Realtime community post change:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Fetch the new post with profile data
            fetchPostWithProfile(payload.new.id).then(newPost => {
              if (newPost) {
                setPosts(prevPosts => [newPost, ...prevPosts]);
              }
            });
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
            });
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
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .maybeSingle();

      if (postError) throw postError;
      if (!postData) return null;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, follower_count, following_count')
        .eq('user_id', postData.user_id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      const postWithProfile = {
        ...postData,
        profiles: profileData || null
      };

      return transformToCommunityPost(postWithProfile);
    } catch (err) {
      console.error('Error fetching post with profile:', err);
      return null;
    }
  };

  return { posts, loading, error, refetch: fetchCommunityPosts };
};