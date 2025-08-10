import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export const useRealTimeComments = (postId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          post_id,
          parent_id,
          profiles!inner(username, display_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data) {
        setComments([]);
        return;
      }

      // Organize comments with replies
      const commentsMap = new Map();
      const rootComments: Comment[] = [];

      data.forEach((comment: any) => {
        const profileData = comment.profiles;
        
        const commentData = {
          ...comment,
          profiles: profileData,
          replies: []
        };
        commentsMap.set(comment.id, commentData);

        if (comment.parent_id === null) {
          rootComments.push(commentData);
        }
      });

      // Add replies to their parent comments
      data.forEach((comment: any) => {
        if (comment.parent_id) {
          const parent = commentsMap.get(comment.parent_id);
          if (parent) {
            parent.replies.push(commentsMap.get(comment.id));
          }
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments();

      // Subscribe to real-time comment changes for this post
      const channel = supabase
        .channel(`comments-${postId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'comments',
            filter: `post_id=eq.${postId}`
          },
          () => {
            // Refetch all comments when any comment changes
            fetchComments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [postId]);

  return { comments, loading, refetch: fetchComments };
};