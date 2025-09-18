import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Story {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  expires_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useStories = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch non-expired stories with user profile data
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content,
          image_url,
          created_at,
          expires_at,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('post_type', 'story')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setStories(data || []);
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stories');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStories = async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content,
          image_url,
          created_at,
          expires_at,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('post_type', 'story')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching user stories:', err);
      return [];
    }
  };

  const createStory = async (content: string, mediaFile?: File) => {
    if (!user) throw new Error('User not authenticated');

    try {
      let mediaUrl = null;

      // Upload media if provided
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `stories/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, mediaFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath);

        mediaUrl = publicUrl;
      }

      // Create story
      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          image_url: mediaUrl,
          post_type: 'story',
        });

      if (insertError) throw insertError;

      // Refresh stories
      await fetchStories();
      return true;
    } catch (err) {
      console.error('Error creating story:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchStories();

    // Subscribe to real-time updates for stories
    const channel = supabase
      .channel('stories-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: 'post_type=eq.story',
        },
        () => {
          fetchStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    stories,
    loading,
    error,
    fetchStories,
    fetchUserStories,
    createStory,
  };
};