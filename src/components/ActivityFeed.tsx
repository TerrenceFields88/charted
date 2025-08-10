import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, MessageCircle, UserPlus, Share, TrendingUp } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'share' | 'post';
  actor: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  target?: {
    id: string;
    content?: string;
    type?: string;
  };
  created_at: string;
  read: boolean;
}

interface ActivityFeedProps {
  userId?: string;
  maxItems?: number;
  showUnreadOnly?: boolean;
}

export const ActivityFeed = ({ userId, maxItems = 20, showUnreadOnly = false }: ActivityFeedProps) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user || userId) {
      fetchActivities();
      
      // Set up real-time subscription for activity updates
      const channel = supabase
        .channel(`activity-${user?.id || userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'likes'
          },
          () => fetchActivities()
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'comments'
          },
          () => fetchActivities()
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'follows'
          },
          () => fetchActivities()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, userId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const targetUserId = userId || user?.id;
      if (!targetUserId) return;

      // This is a simplified version - in a real app you'd want a dedicated activities table
      // For now, we'll simulate by fetching recent interactions on user's posts
      const { data: userPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', targetUserId);

      if (!userPosts) return;

      const postIds = userPosts.map(p => p.id);

      // Fetch recent likes on user's posts - using separate queries due to relation constraints
      const { data: likes } = await supabase
        .from('likes')
        .select('id, created_at, user_id, post_id')
        .in('post_id', postIds)
        .neq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(maxItems);

      // Fetch recent comments on user's posts
      const { data: comments } = await supabase
        .from('comments')
        .select('id, created_at, user_id, post_id, content')
        .in('post_id', postIds)
        .neq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(maxItems);

      // Fetch recent follows
      const { data: follows } = await supabase
        .from('follows')
        .select('id, created_at, follower_id')
        .eq('following_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(maxItems);

      // Get all unique user IDs to fetch profiles
      const allUserIds = new Set<string>();
      likes?.forEach(like => allUserIds.add(like.user_id));
      comments?.forEach(comment => allUserIds.add(comment.user_id));
      follows?.forEach(follow => allUserIds.add(follow.follower_id));

      // Fetch profiles for all users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', Array.from(allUserIds));

      // Create profile map
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.user_id, profile);
      });

      // Combine and sort all activities
      const allActivities: ActivityItem[] = [];

      if (likes) {
        likes.forEach(like => {
          const profile = profileMap.get(like.user_id);
          if (profile) {
            allActivities.push({
              id: `like-${like.id}`,
              type: 'like',
              actor: {
                id: like.user_id,
                username: profile.username,
                display_name: profile.display_name,
                avatar_url: profile.avatar_url
              },
              target: {
                id: like.post_id,
                type: 'post'
              },
              created_at: like.created_at,
              read: false
            });
          }
        });
      }

      if (comments) {
        comments.forEach(comment => {
          const profile = profileMap.get(comment.user_id);
          if (profile) {
            allActivities.push({
              id: `comment-${comment.id}`,
              type: 'comment',
              actor: {
                id: comment.user_id,
                username: profile.username,
                display_name: profile.display_name,
                avatar_url: profile.avatar_url
              },
              target: {
                id: comment.post_id,
                content: comment.content,
                type: 'post'
              },
              created_at: comment.created_at,
              read: false
            });
          }
        });
      }

      if (follows) {
        follows.forEach(follow => {
          const profile = profileMap.get(follow.follower_id);
          if (profile) {
            allActivities.push({
              id: `follow-${follow.id}`,
              type: 'follow',
              actor: {
                id: follow.follower_id,
                username: profile.username,
                display_name: profile.display_name,
                avatar_url: profile.avatar_url
              },
              created_at: follow.created_at,
              read: false
            });
          }
        });
      }

      // Sort by created_at descending
      allActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setActivities(allActivities.slice(0, maxItems));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'share':
        return <Share className="w-4 h-4 text-purple-500" />;
      default:
        return <TrendingUp className="w-4 h-4 text-primary" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      case 'share':
        return 'shared your post';
      default:
        return 'interacted with your content';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-4 space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start space-x-3 p-3 rounded-lg transition-colors hover:bg-muted/50 ${
                  !activity.read ? 'bg-primary/5 border-l-2 border-primary' : ''
                }`}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={activity.actor.avatar_url} />
                  <AvatarFallback>
                    {activity.actor.display_name?.[0] || activity.actor.username[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getActivityIcon(activity.type)}
                    <span className="font-medium text-sm">
                      {activity.actor.display_name || activity.actor.username}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {getActivityText(activity)}
                    </span>
                  </div>
                  
                  {activity.target?.content && (
                    <p className="text-sm text-muted-foreground truncate">
                      "{activity.target.content}"
                    </p>
                  )}
                  
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity.created_at)}
                  </span>
                </div>

                {!activity.read && (
                  <Badge variant="secondary" className="text-xs">
                    New
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};