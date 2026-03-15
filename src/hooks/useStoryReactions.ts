import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface StoryReaction {
  id: string;
  story_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export const STORY_EMOJIS = ['❤️', '🔥', '👏', '😂', '😮', '😢'];

export const useStoryReactions = (storyId: string | undefined) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<StoryReaction[]>([]);
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());

  const fetchReactions = useCallback(async () => {
    if (!storyId) return;
    const { data } = await supabase
      .from('story_reactions')
      .select('*')
      .eq('story_id', storyId);

    if (data) {
      setReactions(data as StoryReaction[]);
      if (user) {
        setUserReactions(new Set(
          (data as StoryReaction[])
            .filter(r => r.user_id === user.id)
            .map(r => r.emoji)
        ));
      }
    }
  }, [storyId, user]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  const toggleReaction = async (emoji: string) => {
    if (!user || !storyId) return;

    if (userReactions.has(emoji)) {
      // Remove reaction
      await supabase
        .from('story_reactions')
        .delete()
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);

      setUserReactions(prev => {
        const next = new Set(prev);
        next.delete(emoji);
        return next;
      });
      setReactions(prev => prev.filter(r => !(r.user_id === user.id && r.emoji === emoji)));
    } else {
      // Add reaction
      const { data } = await supabase
        .from('story_reactions')
        .insert({ story_id: storyId, user_id: user.id, emoji })
        .select()
        .single();

      if (data) {
        setUserReactions(prev => new Set(prev).add(emoji));
        setReactions(prev => [...prev, data as StoryReaction]);
      }
    }
  };

  // Group reactions by emoji with counts
  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return { reactions, reactionCounts, userReactions, toggleReaction };
};
