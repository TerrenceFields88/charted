import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define Profile interface to match the database structure
interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  follower_count: number;
  following_count: number;
  created_at: string;
  updated_at: string;
}

// Hook for real-time profile updates
export const useRealTimeProfiles = () => {
  const [profileUpdates, setProfileUpdates] = useState<Map<string, Profile>>(new Map());

  useEffect(() => {
    // Subscribe to profile changes
    const profileChannel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profile updated:', payload);
          
          if (payload.new) {
            setProfileUpdates(prev => {
              const newMap = new Map(prev);
              newMap.set(payload.new.user_id, payload.new as Profile);
              return newMap;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, []);

  const getUpdatedProfile = (userId: string): Profile | null => {
    return profileUpdates.get(userId) || null;
  };

  const clearProfileUpdate = (userId: string) => {
    setProfileUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(userId);
      return newMap;
    });
  };

  return {
    getUpdatedProfile,
    clearProfileUpdate,
    hasUpdate: (userId: string) => profileUpdates.has(userId)
  };
};

// Hook for real-time follow relationship updates
export const useRealTimeFollows = (currentUserId?: string) => {
  const [followingUpdates, setFollowingUpdates] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (!currentUserId) return;

    // Subscribe to follow changes
    const followChannel = supabase
      .channel('follow-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'follows'
        },
        (payload) => {
          console.log('New follow:', payload);
          
          if (payload.new) {
            // If current user is the follower, track who they're following
            if (payload.new.follower_id === currentUserId) {
              setFollowingUpdates(prev => {
                const newMap = new Map(prev);
                newMap.set(payload.new.following_id, true);
                return newMap;
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'follows'
        },
        (payload) => {
          console.log('Unfollow:', payload);
          
          if (payload.old) {
            // If current user was the follower, track who they unfollowed
            if (payload.old.follower_id === currentUserId) {
              setFollowingUpdates(prev => {
                const newMap = new Map(prev);
                newMap.set(payload.old.following_id, false);
                return newMap;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(followChannel);
    };
  }, [currentUserId]);

  const getFollowStatus = (userId: string): boolean | null => {
    return followingUpdates.has(userId) ? followingUpdates.get(userId)! : null;
  };

  const clearFollowUpdate = (userId: string) => {
    setFollowingUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(userId);
      return newMap;
    });
  };

  return {
    getFollowStatus,
    clearFollowUpdate,
    hasUpdate: (userId: string) => followingUpdates.has(userId)
  };
};