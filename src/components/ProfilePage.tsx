import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { usePosts } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { PostCard } from '@/components/PostCard';
import { 
   Settings, 
   Edit, 
   TrendingUp, 
   Users, 
   Target,
   Award,
   Plus,
   RefreshCw,
   CheckCircle,
   Link,
   Calendar,
   Camera,
   MoreHorizontal,
   Shield,
   HelpCircle,
   LogOut
 } from 'lucide-react';
import { useTradingPerformance } from '@/hooks/useTradingPerformance';
import { useRealTimeBrokerageData } from '@/hooks/useRealTimeBrokerageData';
import { BrokerageConnectionDialog } from '@/components/BrokerageConnectionDialog';
import { MessagesPage } from '@/components/MessagesPage';
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
  
  const { performance, getFormattedPerformance, recentTrades, loading: performanceLoading } = useTradingPerformance();
  const { 
    aggregatedData, 
    loading: brokerageLoading, 
    lastUpdate, 
    hasConnectedAccounts,
    syncAllAccounts 
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
        winningTrades: aggregatedData.recentTrades.filter(t => (t.pnl || 0) > 0).length,
        losingTrades: aggregatedData.recentTrades.filter(t => (t.pnl || 0) < 0).length,
        riskRewardRatio: `${aggregatedData.performanceMetrics.profit_factor.toFixed(1)}:1`,
        totalTrades: aggregatedData.recentTrades.length,
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

  // Show create profile UI if no profile exists
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

  const stats = [
    { label: 'Win Rate', value: performanceData.winRate, icon: Target, color: 'text-primary' },
    { label: 'Followers', value: profile.follower_count.toLocaleString(), icon: Users, color: 'text-foreground' },
  ];

  // Only show real achievements when they have actual trading data
  const achievements = performance && performance.total_trades > 0 ? [
    ...(performance.total_trades >= 50 ? [{ 
      title: 'Active Trader', 
      description: `Completed ${performance.total_trades} trades`, 
      icon: Award, 
      color: 'bg-blue-500' 
    }] : []),
    ...(performance.win_rate_percentage >= 70 ? [{ 
      title: 'High Win Rate', 
      description: `${performance.win_rate_percentage.toFixed(0)}% win rate achieved`, 
      icon: TrendingUp, 
      color: 'bg-green-500' 
    }] : []),
    ...(performance.portfolio_return_percentage >= 20 ? [{ 
      title: 'Profitable Trader', 
      description: `${performance.portfolio_return_percentage.toFixed(1)}% portfolio return`, 
      icon: Award, 
      color: 'bg-yellow-500' 
    }] : []),
  ] : [];

  // Format recent trades for activity display - use real-time data if available
  const formatRecentActivity = () => {
    const activities = [];
    
    // Add recent trades from real-time data if available, otherwise use database trades
    const tradesToShow = hasConnectedAccounts && aggregatedData.recentTrades.length > 0 
      ? aggregatedData.recentTrades.slice(0, 5)
      : recentTrades.slice(0, 3);

    tradesToShow.forEach(trade => {
      activities.push({
        type: 'trade',
        symbol: trade.symbol,
        action: hasConnectedAccounts ? trade.side : (trade.trade_type === 'buy' ? 'Buy' : 'Sell'),
        price: trade.price,
        profit_loss: trade.pnl || trade.profit_loss,
        timestamp: new Date(hasConnectedAccounts ? trade.timestamp : trade.executed_at).toLocaleDateString()
      });
    });

    // Add recent posts
    userPosts.slice(0, 2).forEach(post => {
      activities.push({
        type: 'post',
        content: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
        likes: post.likes || 0,
        timestamp: new Date(post.timestamp).toLocaleDateString()
      });
    });

    return activities.sort(() => Math.random() - 0.5); // Mix activities
  };

  const recentActivity = formatRecentActivity();

  const handleSettingsClick = (action: string) => {
    switch (action) {
      case 'edit-profile':
        navigate('/edit-profile');
        break;
      case 'connect-account':
        // BrokerageConnectionDialog manages its own state
        break;
      case 'privacy':
        // TODO: Open privacy settings
        break;
      case 'help':
        // TODO: Open help
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
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
                <DropdownMenuItem onClick={() => handleSettingsClick('connect-account')}>
                  <Link className="w-4 h-4 mr-2" />
                  Connect Account
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSettingsClick('privacy')}>
                  <Shield className="w-4 h-4 mr-2" />
                  Privacy & Security
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSettingsClick('help')}>
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help & Support
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

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Joined {formatDate(profile.created_at)}
                  </span>
                  <span className="text-primary">TD Ameritrade</span>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={syncAllAccounts}>
                    <Link className="w-3 h-3" />
                  </Button>
                </div>
                
                {/* Stats Row */}
                <div className="flex gap-6 text-sm pt-2">
                  {stats.map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="font-semibold">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {hasConnectedAccounts && aggregatedData.allPositions.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-2 text-sm">Current Positions</h4>
                    <div className="space-y-2">
                      {aggregatedData.allPositions.slice(0, 3).map((position, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted/20 rounded text-sm">
                          <div>
                            <span className="font-medium">{position.symbol}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {position.quantity} @ ${position.current_price.toFixed(2)}
                            </span>
                          </div>
                          <div className={`text-xs font-medium ${position.unrealized_pnl >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                            {position.unrealized_pnl >= 0 ? '+' : ''}${position.unrealized_pnl.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {performanceData.totalTrades === 0 && !hasConnectedAccounts && (
                  <div className="text-center py-4 text-muted-foreground mt-4 pt-4 border-t">
                    <p className="text-sm">No trading data available.</p>
                    <p className="text-xs">Connect your brokerage or prop firm account to see real performance.</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="posts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="posts">My Posts</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No recent activity.</p>
                    <p className="text-sm">Start trading and posting to see your activity here.</p>
                  </div>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        {activity.type === 'trade' && (
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              {activity.action} {activity.symbol}
                              <span className="text-muted-foreground font-normal"> at ${activity.price}</span>
                            </div>
                            {activity.profit_loss !== undefined && activity.profit_loss !== null && (
                              <div className={`text-xs font-semibold ${activity.profit_loss > 0 ? 'text-bullish' : 'text-bearish'}`}>
                                {activity.profit_loss > 0 ? '+' : ''}${activity.profit_loss}
                              </div>
                            )}
                          </div>
                        )}
                        {activity.type === 'post' && (
                          <div>
                            <span>Posted: </span>
                            <span className="font-medium">{activity.content}</span>
                            <span className="text-muted-foreground"> • {activity.likes} likes</span>
                          </div>
                        )}
                        {activity.type === 'follow' && (
                          <div>
                            <span>Started following </span>
                            <span className="font-medium">@{activity.user}</span>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">{activity.timestamp}</div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Total Portfolio Value</div>
                      <div className="text-lg font-semibold">
                        {hasConnectedAccounts ? `$${aggregatedData.totalEquity.toLocaleString()}` : 'N/A'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Portfolio Return</div>
                      <div className={`text-lg font-semibold ${performanceData.portfolioReturn.startsWith('+') ? 'text-bullish' : 'text-bearish'}`}>
                        {performanceData.portfolioReturn}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {achievements.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                      <Award className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">No Achievements Yet</h3>
                      <p className="text-muted-foreground text-sm">
                        Connect your trading account and start trading to earn achievements based on real performance.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                achievements.map((achievement, index) => (
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
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="posts">
            <div className="space-y-4">
              {userPosts.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      No posts yet. Share your first trading insight!
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

          <TabsContent value="messages">
            <MessagesPage />
          </TabsContent>
        </Tabs>

        {/* Story Viewer */}
        <StoryViewer
          open={storyViewerOpen}
          onOpenChange={setStoryViewerOpen}
          stories={stories}
        />

        {/* Create Story Dialog */}
        <CreateStoryDialog
          open={createStoryOpen}
          onOpenChange={setCreateStoryOpen}
        />

        {/* Brokerage Connection Dialog - managed internally */}
        <BrokerageConnectionDialog />
      </div>
    </div>
  );
};