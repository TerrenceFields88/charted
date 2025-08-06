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
  Heart,
  RefreshCw
} from 'lucide-react';
import { useTradingPerformance } from '@/hooks/useTradingPerformance';
import { useRealTimeBrokerageData } from '@/hooks/useRealTimeBrokerageData';
import { BrokerageConnectionDialog } from '@/components/BrokerageConnectionDialog';
import { MessagesPage } from '@/components/MessagesPage';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  const { posts } = usePosts();
  const { user } = useAuth();
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
    { 
      label: 'Portfolio Return', 
      value: performanceData.portfolioReturn, 
      icon: TrendingUp, 
      color: performanceData.portfolioReturn.startsWith('+') ? 'text-bullish' : 'text-bearish' 
    },
    { 
      label: 'Portfolio Value', 
      value: hasConnectedAccounts ? `$${aggregatedData.totalEquity.toLocaleString()}` : 'N/A', 
      icon: Target, 
      color: 'text-primary' 
    },
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
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
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
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                    Trader
                  </Badge>
                  {profile.verified_trader && (
                    <Badge variant="default" className="bg-bullish text-white">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-3">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-sm text-muted-foreground mb-3">{profile.bio}</p>
                )}

                {/* Connected Brokers Display */}
                {profile.connected_brokers && Array.isArray(profile.connected_brokers) && profile.connected_brokers.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Connected Accounts</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.connected_brokers.slice(0, 3).map((broker: any, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {broker.broker_name?.replace(/_/g, ' ') || 'Unknown Broker'}
                        </Badge>
                      ))}
                      {profile.connected_brokers.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{profile.connected_brokers.length - 3} more
                        </Badge>
                      )}
                    </div>
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
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Trading Performance
                {hasConnectedAccounts && (
                  <Badge variant="outline" className="text-bullish border-bullish">
                    Live Data
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {hasConnectedAccounts && (
                  <Button variant="outline" size="sm" onClick={syncAllAccounts}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Sync
                  </Button>
                )}
                <BrokerageConnectionDialog />
              </div>
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {hasConnectedAccounts 
                  ? 'Real-time data from connected accounts'
                  : 'Connect your brokerage or prop firm account to track real performance'
                }
              </p>
              {lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(performanceLoading || brokerageLoading) ? (
              <div className="text-center text-muted-foreground">Loading performance data...</div>
            ) : (
              <>
                {hasConnectedAccounts && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">${aggregatedData.totalEquity.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Total Portfolio Value</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${aggregatedData.totalPnL >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                        {aggregatedData.totalPnL >= 0 ? '+' : ''}${aggregatedData.totalPnL.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">Daily P&L</div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Win Rate</span>
                    <span className="font-medium">{performanceData.winRate}</span>
                  </div>
                  <Progress 
                    value={parseInt(performanceData.winRate.replace('%', ''))} 
                    className="h-2" 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Portfolio Return</span>
                    <span className={`font-medium ${performanceData.portfolioReturn.startsWith('+') ? 'text-bullish' : 'text-bearish'}`}>
                      {performanceData.portfolioReturn}
                    </span>
                  </div>
                  <Progress 
                    value={Math.abs(parseFloat(performanceData.portfolioReturn.replace(/[%+]/g, '')))} 
                    className="h-2" 
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-bullish">{performanceData.winningTrades}</div>
                    <div className="text-xs text-muted-foreground">Winning Trades</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-bearish">{performanceData.losingTrades}</div>
                    <div className="text-xs text-muted-foreground">Losing Trades</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{performanceData.riskRewardRatio}</div>
                    <div className="text-xs text-muted-foreground">Risk/Reward</div>
                  </div>
                </div>

                {hasConnectedAccounts && aggregatedData.allPositions.length > 0 && (
                  <div className="pt-4">
                    <h4 className="font-medium mb-2">Current Positions</h4>
                    <div className="space-y-2">
                      {aggregatedData.allPositions.slice(0, 3).map((position, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted/20 rounded">
                          <div>
                            <span className="font-medium">{position.symbol}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {position.quantity} shares @ ${position.current_price.toFixed(2)}
                            </span>
                          </div>
                          <div className={`text-sm font-medium ${position.unrealized_pnl >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                            {position.unrealized_pnl >= 0 ? '+' : ''}${position.unrealized_pnl.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {performanceData.totalTrades === 0 && !hasConnectedAccounts && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No trading data available.</p>
                    <p className="text-sm">Connect your brokerage or prop firm account to see real performance.</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="posts">My Posts</TabsTrigger>
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
                          <div>
                            <span className="font-medium">{activity.action} {activity.symbol}</span>
                            <span className="text-muted-foreground"> at ${activity.price}</span>
                            {activity.profit_loss && (
                              <span className={`ml-2 ${activity.profit_loss > 0 ? 'text-bullish' : 'text-bearish'}`}>
                                ({activity.profit_loss > 0 ? '+' : ''}${activity.profit_loss})
                              </span>
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
      </div>
    </div>
  );
};