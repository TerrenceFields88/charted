import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  Target,
  Award,
  Heart,
  Calendar
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

  // Mock stats for demonstration (in a real app, these would come from analytics)
  const stats = [
    { label: 'Portfolio Return', value: '+18.3%', icon: TrendingUp, color: 'text-bullish' },
    { label: 'Win Rate', value: '67%', icon: Target, color: 'text-primary' },
    { label: 'Followers', value: profile.follower_count.toLocaleString(), icon: Users, color: 'text-foreground' },
    { label: 'Following', value: profile.following_count.toLocaleString(), icon: Heart, color: 'text-foreground' },
  ];

  const achievements = [
    { title: 'Active Trader', description: 'Consistent trading activity', icon: TrendingUp, color: 'bg-blue-500' },
    { title: 'Community Member', description: 'Active in community discussions', icon: Users, color: 'bg-green-500' },
    { title: 'Analyst', description: 'Shares market insights', icon: Target, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">@{profile.username}</h1>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || profile.username} />
                <AvatarFallback className="text-2xl">
                  {(profile.display_name || profile.username)[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{profile.display_name || profile.username}</h2>
                <Badge variant="secondary">
                  Trader
                </Badge>
              </div>
              <p className="text-muted-foreground mb-2">@{profile.username}</p>
              
              {profile.bio && (
                <p className="text-sm text-muted-foreground mb-3">{profile.bio}</p>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <Calendar className="w-3 h-3" />
                <span>Joined {formatDate(profile.created_at)}</span>
              </div>
              
              {/* Action Buttons */}
              {user?.id !== userId && (
                <div className="flex gap-2 mb-4">
                  <Button
                    onClick={handleFollow}
                    disabled={followLoading}
                    variant={isFollowing ? "outline" : "default"}
                    size="sm"
                    className="flex-1"
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-2" />
                        {followLoading ? 'Updating...' : 'Unfollow'}
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        {followLoading ? 'Following...' : 'Follow'}
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className={`flex items-center justify-center gap-1 ${stat.color}`}>
                      <stat.icon className="w-4 h-4" />
                      <span className="font-bold">{stat.value}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Trading Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Win Rate</span>
              <span className="font-medium">67%</span>
            </div>
            <Progress value={67} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Portfolio Return</span>
              <span className="font-medium text-bullish">+18.3%</span>
            </div>
            <Progress value={65} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <div className="text-lg font-bold text-bullish">89</div>
              <div className="text-xs text-muted-foreground">Winning Trades</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-bearish">44</div>
              <div className="text-xs text-muted-foreground">Losing Trades</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">2.1:1</div>
              <div className="text-xs text-muted-foreground">Risk/Reward</div>
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