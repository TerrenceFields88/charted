import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { PostCard } from '@/components/PostCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/useSupabaseData';
import { useRealTimeProfiles, useRealTimeFollows } from '@/hooks/useRealTimeUpdates';
import { toast } from '@/hooks/use-toast';
import { sanitizeErrorMessage } from '@/lib/validation';
import { 
  ArrowLeft,
  UserPlus,
  UserMinus,
  MessageCircle,
  TrendingUp,
  Users,
  Award,
  Calendar,
  CheckCircle,
  Link
} from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  follower_count: number;
  following_count: number;
  created_at: string;
  verified_trader?: boolean;
}

interface UserProfileViewProps {
  userId: string;
  onBack: () => void;
}

export const UserProfileView = ({ userId, onBack }: UserProfileViewProps) => {
  const { user } = useAuth();
  const { posts } = usePosts();
  const { getUpdatedProfile, hasUpdate } = useRealTimeProfiles();
  const { getFollowStatus, hasUpdate: hasFollowUpdate } = useRealTimeFollows(user?.id);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Filter posts by the viewed user
  const userPosts = posts.filter(post => post.user.id === userId);

  // Real-time profile updates
  useEffect(() => {
    if (hasUpdate(userId)) {
      const updatedProfile = getUpdatedProfile(userId);
      if (updatedProfile) {
        setProfile(prev => prev ? {
          ...prev,
          follower_count: updatedProfile.follower_count,
          following_count: updatedProfile.following_count,
          display_name: updatedProfile.display_name,
          bio: updatedProfile.bio,
          avatar_url: updatedProfile.avatar_url,
        } : null);
      }
    }
  }, [userId, hasUpdate, getUpdatedProfile]);

  // Real-time follow status updates
  useEffect(() => {
    if (user && hasFollowUpdate(userId)) {
      const followStatus = getFollowStatus(userId);
      if (followStatus !== null) {
        setIsFollowing(followStatus);
      }
    }
  }, [user, userId, hasFollowUpdate, getFollowStatus]);

  useEffect(() => {
    fetchProfile();
    checkFollowStatus();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: sanitizeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      setIsFollowing(!!data);
    } catch (error) {
      // Not following (expected when no record exists)
      setIsFollowing(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !profile) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;

        setIsFollowing(false);
        // Note: Profile counts will be updated automatically by the database trigger and real-time subscription

        toast({
          title: "Unfollowed",
          description: `You are no longer following @${profile.username}`,
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });

        if (error) throw error;

        setIsFollowing(true);
        // Note: Profile counts will be updated automatically by the database trigger and real-time subscription

        toast({
          title: "Following",
          description: `You are now following @${profile.username}`,
        });
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast({
        title: "Error",
        description: sanitizeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-bold">Loading...</h1>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-bold">Profile Not Found</h1>
        </div>
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">This user profile could not be found.</p>
        </div>
      </div>
    );
  }

  // Only show real data from connected brokers
  const stats = [
    { label: 'Win Rate', value: '67%', icon: TrendingUp, color: 'text-primary' },
    { label: 'Followers', value: profile.follower_count.toLocaleString(), icon: Users, color: 'text-foreground' },
  ];

  const achievements = [
    { title: 'Active Trader', description: 'Consistent trading activity', icon: TrendingUp, color: 'bg-blue-500' },
    { title: 'Community Member', description: 'Active in community discussions', icon: Users, color: 'bg-green-500' },
    { title: 'Analyst', description: 'Shares market insights', icon: Award, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-semibold">@{profile.username}</h1>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || profile.username} />
              <AvatarFallback className="text-lg">
                {(profile.display_name || profile.username)[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h2 className="text-lg font-semibold truncate">{profile.display_name || profile.username}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  @{profile.username}
                  {profile.verified_trader && <CheckCircle className="w-3 h-3 text-bullish" />}
                </p>
              </div>
              
              {profile.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Joined {formatDate(profile.created_at)}
                </span>
                <span className="text-primary">TD Ameritrade</span>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                  <Link className="w-3 h-3" />
                </Button>
              </div>
              
              {/* Stats and Actions Row */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">67%</div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{profile.follower_count}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">89/44</div>
                    <div className="text-xs text-muted-foreground">W/L</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">2.1:1</div>
                    <div className="text-xs text-muted-foreground">R/R</div>
                  </div>
                </div>
                
                {user?.id !== userId && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleFollow}
                      disabled={followLoading}
                      variant={isFollowing ? "outline" : "default"}
                      size="sm"
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-1" />
                          {followLoading ? 'Updating...' : 'Unfollow'}
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-1" />
                          {followLoading ? 'Following...' : 'Follow'}
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <div className="space-y-4">
            {userPosts.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    No posts yet from this user.
                  </div>
                </CardContent>
              </Card>
            ) : (
              userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="achievements">
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Total Portfolio Value</div>
                    <div className="text-lg font-semibold">N/A</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Portfolio Return</div>
                    <div className="text-lg font-semibold text-bullish">+18.3%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {achievements.map((achievement, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full ${achievement.color} flex items-center justify-center`}>
                      <achievement.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};