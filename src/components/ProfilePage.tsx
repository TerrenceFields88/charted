import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { usePosts } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { 
   Settings, 
   Edit, 
   Users,
   Plus,
   CheckCircle,
   MoreHorizontal,
   LogOut
 } from 'lucide-react';
import { useTradingPerformance } from '@/hooks/useTradingPerformance';
import { useRealTimeBrokerageData } from '@/hooks/useRealTimeBrokerageData';
import { StoryViewer } from '@/components/StoryViewer';
import { CreateStoryDialog } from '@/components/CreateStoryDialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  const { posts } = usePosts();
  const { user } = useAuth();
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [stories, setStories] = useState([]);
  
  const { performance, getFormattedPerformance } = useTradingPerformance();
  const { 
    aggregatedData, 
    hasConnectedAccounts,
  } = useRealTimeBrokerageData();
  
  // Filter posts by current user
  const userPosts = posts.filter(post => post.user.id === user?.id);

  // Get real trading performance data - use real-time data if available
  const performanceData = hasConnectedAccounts && aggregatedData.performanceMetrics 
    ? {
        portfolioReturn: aggregatedData.totalPnL >= 0 
          ? `+${(aggregatedData.totalPnL / aggregatedData.totalEquity * 100).toFixed(2)}%`
          : `${(aggregatedData.totalPnL / aggregatedData.totalEquity * 100).toFixed(2)}%`,
        winRate: `${aggregatedData.performanceMetrics.win_rate.toFixed(0)}%`,
      }
    : getFormattedPerformance();

  // Show create profile UI if no user is logged in
  if (!user) {
    return (
      <div className="pb-20">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
          <h1 className="text-xl font-bold">Profile</h1>
        </div>
        <div className="px-4 py-6">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <Avatar className="w-24 h-24 mx-auto">
                <AvatarFallback className="text-2xl">
                  <Users className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold mb-2">Join the Community</h2>
                <p className="text-muted-foreground mb-4">
                  Log in to create your trading profile and connect with traders
                </p>
                <Button onClick={() => navigate('/auth')}>
                  <Users className="w-4 h-4 mr-2" />
                  Sign Up / Log In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="pb-20">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
          <h1 className="text-xl font-bold">Profile</h1>
        </div>
        <div className="px-4 py-6 text-center">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show create profile UI if no profile exists
  if (!profile) {
    return (
      <div className="pb-20">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
          <h1 className="text-xl font-bold">Profile</h1>
        </div>
        <div className="px-4 py-6">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <Avatar className="w-24 h-24 mx-auto">
                <AvatarFallback className="text-2xl">
                  <Plus className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold mb-2">Create Your Profile</h2>
                <p className="text-muted-foreground mb-4">
                  Set up your trading profile to start connecting with the community
                </p>
                <Button onClick={() => navigate('/edit-profile')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSettingsClick = (action: string) => {
    switch (action) {
      case 'edit-profile':
        navigate('/edit-profile');
        break;
      case 'logout':
        // TODO: Implement logout
        break;
    }
  };

  const handleProfilePhotoClick = () => {
    // Check if user has stories
    if (stories.length > 0) {
      setStoryViewerOpen(true);
    } else {
      setCreateStoryOpen(true);
    }
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Profile</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/edit-profile')}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleSettingsClick('edit-profile')}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSettingsClick('logout')} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative">
                <Avatar 
                  className="w-16 h-16 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
                  onClick={handleProfilePhotoClick}
                >
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || profile.username} />
                  <AvatarFallback className="text-lg">
                    {(profile.display_name || profile.username)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Story ring indicator */}
                {stories.length > 0 && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 to-orange-500 p-0.5">
                    <div className="w-full h-full bg-background rounded-full" />
                  </div>
                )}
                {/* Add story button */}
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 w-6 h-6 p-0 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreateStoryOpen(true);
                  }}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              
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
                
                {/* Simple Stats Row */}
                <div className="flex gap-6 text-sm pt-2">
                  <div className="text-center">
                    <div className="font-semibold">{performanceData.winRate}</div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{profile.follower_count}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="posts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            {userPosts.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <p>No posts yet.</p>
                    <p className="text-sm">Share your first trading insight or market analysis.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {userPosts.map((post) => (
                  <div 
                    key={post.id} 
                    className="aspect-square bg-muted rounded-sm overflow-hidden group cursor-pointer relative"
                  >
                    {post.image ? (
                      <img 
                        src={post.image} 
                        alt="Post content"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20 p-2">
                        <p className="text-xs text-center line-clamp-4 text-muted-foreground group-hover:text-foreground transition-colors">
                          {post.content}
                        </p>
                      </div>
                    )}
                    {/* Hover overlay with stats */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="text-white text-xs space-y-1 text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <span>❤️ {post.likes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 justify-center">
                          <span>💬 {post.comments || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <p>Activity coming soon.</p>
                  <p className="text-sm">Your recent trades and posts will appear here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Story Viewer */}
      <StoryViewer
        open={storyViewerOpen}
        onOpenChange={setStoryViewerOpen}
        stories={[]}
        initialStoryIndex={0}
      />

      {/* Create Story Dialog */}
      <CreateStoryDialog
        open={createStoryOpen}
        onOpenChange={setCreateStoryOpen}
      />
    </div>
  );
};