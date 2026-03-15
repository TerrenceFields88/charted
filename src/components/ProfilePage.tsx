import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { usePosts } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Edit, Users, Plus, CheckCircle, LogOut } from 'lucide-react';
import { useTradingPerformance } from '@/hooks/useTradingPerformance';
import { useRealTimeBrokerageData } from '@/hooks/useRealTimeBrokerageData';
import { StoryViewer } from '@/components/StoryViewer';
import { CreateStoryDialog } from '@/components/CreateStoryDialog';
import { PortfolioSection } from '@/components/PortfolioSection';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  const { posts } = usePosts();
  const { user, signOut } = useAuth();
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [stories] = useState([]);

  const { getFormattedPerformance } = useTradingPerformance();
  const { aggregatedData, hasConnectedAccounts } = useRealTimeBrokerageData();

  const userPosts = posts.filter(post => post.user.id === user?.id);

  const performanceData = hasConnectedAccounts && aggregatedData.performanceMetrics
    ? {
        portfolioReturn: aggregatedData.totalPnL >= 0
          ? `+${(aggregatedData.totalPnL / aggregatedData.totalEquity * 100).toFixed(2)}%`
          : `${(aggregatedData.totalPnL / aggregatedData.totalEquity * 100).toFixed(2)}%`,
        winRate: `${aggregatedData.performanceMetrics.win_rate.toFixed(0)}%`,
      }
    : getFormattedPerformance();

  if (!user) {
    return (
      <div className="pb-20 flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Users className="w-10 h-10 text-muted-foreground mb-3" />
        <h2 className="text-lg font-bold mb-1">Join the Community</h2>
        <p className="text-sm text-muted-foreground text-center mb-4">Log in to create your trading profile</p>
        <Button onClick={() => navigate('/auth')} size="sm">Sign Up / Log In</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pb-20">
        <div className="sticky top-0 glass border-b border-border/50 z-40 px-4 py-3">
          <h1 className="text-lg font-bold">Profile</h1>
        </div>
        <div className="px-4 py-6 space-y-4">
          <div className="flex gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="pb-20 flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Plus className="w-10 h-10 text-muted-foreground mb-3" />
        <h2 className="text-lg font-bold mb-1">Create Your Profile</h2>
        <p className="text-sm text-muted-foreground text-center mb-4">Set up your trading profile to get started</p>
        <Button onClick={() => navigate('/edit-profile')} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Create Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 glass border-b border-border/50 z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">Profile</h1>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/edit-profile')}>
              <Edit className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => navigate('/edit-profile')}>
                  <Edit className="w-4 h-4 mr-2" /> Edit Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Profile card */}
        <div className="flex gap-4">
          <div className="relative">
            <Avatar
              className="w-16 h-16 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
              onClick={() => stories.length > 0 ? setStoryViewerOpen(true) : setCreateStoryOpen(true)}
            >
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {(profile.display_name || profile.username)[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
              onClick={() => setCreateStoryOpen(true)}
            >
              <Plus className="w-3 h-3 text-primary-foreground" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold truncate">{profile.display_name || profile.username}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              @{profile.username}
              {profile.verified_trader && <CheckCircle className="w-3 h-3 text-success" />}
            </p>
            {profile.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>}

            <div className="flex gap-5 mt-2">
              <div>
                <p className="text-sm font-semibold">{performanceData.winRate}</p>
                <p className="text-[10px] text-muted-foreground">Win Rate</p>
              </div>
              <div>
                <p className="text-sm font-semibold">{profile.follower_count}</p>
                <p className="text-[10px] text-muted-foreground">Followers</p>
              </div>
              <div>
                <p className="text-sm font-semibold">{userPosts.length}</p>
                <p className="text-[10px] text-muted-foreground">Posts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts">
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="posts" className="text-xs">Posts</TabsTrigger>
            <TabsTrigger value="portfolio" className="text-xs">Portfolio</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-3">
            {userPosts.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                <p>No posts yet</p>
                <p className="text-xs mt-1">Share your first trading insight!</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5 rounded-lg overflow-hidden">
                {userPosts.map((post) => (
                  <div key={post.id} className="aspect-square bg-muted overflow-hidden group cursor-pointer relative">
                    {post.image ? (
                      <img src={post.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted p-2">
                        <p className="text-[10px] text-center line-clamp-4 text-muted-foreground">{post.content}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-foreground text-[10px] space-y-0.5 text-center">
                        <p>❤️ {post.likes || 0}</p>
                        <p>💬 {post.comments || 0}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="portfolio" className="mt-3">
            <PortfolioSection />
          </TabsContent>

          <TabsContent value="activity" className="mt-3">
            <div className="text-center py-10 text-sm text-muted-foreground">
              <p>Activity coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <StoryViewer open={storyViewerOpen} onOpenChange={setStoryViewerOpen} stories={[]} initialStoryIndex={0} />
      <CreateStoryDialog open={createStoryOpen} onOpenChange={setCreateStoryOpen} />
    </div>
  );
};
