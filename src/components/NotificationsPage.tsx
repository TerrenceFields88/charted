import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivityFeed } from '@/components/ActivityFeed';
import { 
  Bell, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Settings,
  Check,
  X,
  MoreHorizontal
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'market' | 'social' | 'trade' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    href: string;
  };
}

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'market',
      title: 'TSLA Price Alert',
      message: 'Tesla (TSLA) has reached your target price of $420.00',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
      action: { label: 'View Chart', href: '/markets' }
    },
    {
      id: '2',
      type: 'social',
      title: 'New Follower',
      message: 'John Doe started following your trading insights',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: false,
      action: { label: 'View Profile', href: '/profile' }
    },
    {
      id: '3',
      type: 'trade',
      title: 'Trade Executed',
      message: 'Your buy order for 100 shares of AAPL has been filled at $175.50',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true
    },
    {
      id: '4',
      type: 'market',
      title: 'Market Alert',
      message: 'S&P 500 is up 2.5% today - highest gain this month',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: true
    },
    {
      id: '5',
      type: 'social',
      title: 'Comment on Post',
      message: 'Sarah commented on your Bitcoin analysis post',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      read: true,
      action: { label: 'View Comment', href: '/feed' }
    }
  ]);

  const [activeTab, setActiveTab] = useState('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'market':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'social':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'trade':
        return <MessageCircle className="w-4 h-4 text-purple-500" />;
      case 'system':
        return <Settings className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notif.read;
    return notif.type === activeTab;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
            >
              <Check className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="trade">Trades</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <ActivityFeed maxItems={50} />
          </TabsContent>

          <TabsContent value="unread" className="mt-6">
            <ActivityFeed maxItems={50} showUnreadOnly={true} />
          </TabsContent>

          <TabsContent value="market" className="mt-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Market Notifications</h3>
                <p className="text-muted-foreground text-sm">
                  Set up price alerts and market notifications in settings
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="mt-6">
            <ActivityFeed maxItems={50} />
          </TabsContent>

          <TabsContent value="trade" className="mt-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Trade Notifications</h3>
                <p className="text-muted-foreground text-sm">
                  Connect your brokerage account to see trade confirmations
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Price Alerts</div>
                <div className="text-sm text-muted-foreground">Get notified when stocks hit your target price</div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Social Updates</div>
                <div className="text-sm text-muted-foreground">Notifications from followers and comments</div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Trade Confirmations</div>
                <div className="text-sm text-muted-foreground">Alerts for executed trades and orders</div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};