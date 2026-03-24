import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  follower_count: number;
  following_count: number;
  verified_trader: boolean;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }
      
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profileData: {
    username: string;
    display_name?: string;
    bio?: string;
    avatar_url?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          username: profileData.username,
          display_name: profileData.display_name || null,
          bio: profileData.bio || null,
          avatar_url: profileData.avatar_url || null,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error creating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to create profile');
      return null;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return null;

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return null;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  // Listen for profile changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setProfile(payload.new as Profile);
          } else if (payload.eventType === 'DELETE') {
            setProfile(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    createProfile,
    updateProfile,
    refetch: fetchProfile,
  };
};