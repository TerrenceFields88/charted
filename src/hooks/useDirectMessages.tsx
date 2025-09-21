import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  shared_post_id: string | null;
  message_type: 'text' | 'shared_post';
  is_read: boolean;
  created_at: string;
}

export const useDirectMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sharePostToUser = async (postId: string, recipientUserId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Get or create conversation
      const { data: conversationId, error: convError } = await supabase.rpc(
        'get_or_create_conversation',
        { user_1: user.id, user_2: recipientUserId }
      );

      if (convError) throw convError;

      // Send the shared post message
      const { data, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          shared_post_id: postId,
          message_type: 'shared_post',
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: 'text',
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const getUsersForSharing = async (): Promise<Profile[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .neq('user_id', user?.id || '') // Exclude current user
        .order('display_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };

  const fetchConversations = async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (fetchError) throw fetchError;
      setConversations(data || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Set up real-time subscription for conversation updates
    if (user) {
      const channel = supabase
        .channel(`conversations-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `participant_1=eq.${user.id},participant_2=eq.${user.id}`
          },
          () => {
            fetchConversations();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          () => {
            fetchConversations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    conversations,
    loading,
    error,
    sharePostToUser,
    sendMessage,
    getUsersForSharing,
    refetch: fetchConversations,
  };
};