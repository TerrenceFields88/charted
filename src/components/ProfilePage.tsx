import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, 
  Edit, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Heart,
  MessageCircle,
  Target,
  Award,
  Calendar
} from 'lucide-react';
import { mockUsers } from '@/data/mockUsers';

export const ProfilePage = () => {
  // Using first user as current user for demo
  const currentUser = mockUsers[0];
  
  const stats = [
    { label: 'Portfolio Return', value: `+${currentUser.portfolioReturn}%`, icon: TrendingUp, color: 'text-bullish' },
    { label: 'Win Rate', value: `${currentUser.winRate}%`, icon: Target, color: 'text-primary' },
    { label: 'Followers', value: currentUser.followersCount.toLocaleString(), icon: Users, color: 'text-foreground' },
    { label: 'Following', value: currentUser.followingCount.toLocaleString(), icon: Heart, color: 'text-foreground' },
  ];

  const achievements = [
    { title: 'Gold Trader', description: 'Achieved 50+ profitable gold trades', icon: Award, color: 'bg-yellow-500' },
    { title: 'Community Star', description: '1000+ likes on posts', icon: Heart, color: 'bg-red-500' },
    { title: 'Analysis Expert', description: 'Top 10% technical analysis accuracy', icon: TrendingUp, color: 'bg-green-500' },
  ];

  const recentActivity = [
    { type: 'trade', symbol: 'GC', action: 'Buy', price: 2035.40, timestamp: '2 hours ago' },
    { type: 'post', content: 'Gold breaking through resistance...', likes: 234, timestamp: '4 hours ago' },
    { type: 'follow', user: 'sarah_forex', timestamp: '1 day ago' },
  ];

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Profile</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
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
                  <AvatarImage src={currentUser.avatar} alt={currentUser.displayName} />
                  <AvatarFallback className="text-2xl">{currentUser.displayName[0]}</AvatarFallback>
                </Avatar>
                {currentUser.isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-primary-foreground rounded-full" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold">{currentUser.displayName}</h2>
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                    {currentUser.tradingLevel}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-3">@{currentUser.username}</p>
                
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
                <span className="font-medium">{currentUser.winRate}%</span>
              </div>
              <Progress value={currentUser.winRate} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Portfolio Return</span>
                <span className="font-medium text-bullish">+{currentUser.portfolioReturn}%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <div className="text-lg font-bold text-bullish">127</div>
                <div className="text-xs text-muted-foreground">Winning Trades</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-bearish">47</div>
                <div className="text-xs text-muted-foreground">Losing Trades</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">2.7:1</div>
                <div className="text-xs text-muted-foreground">Risk/Reward</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="posts">My Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      {activity.type === 'trade' && (
                        <div>
                          <span className="font-medium">{activity.action} ${activity.symbol}</span>
                          <span className="text-muted-foreground"> at ${activity.price}</span>
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
                ))}
              </CardContent>
            </Card>
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

          <TabsContent value="posts">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  Your posts will appear here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};