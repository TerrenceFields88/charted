import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

export const NotificationsPage = () => {
  // Mock notifications data
  const notifications = [
    {
      id: 1,
      type: 'price_alert',
      title: 'AAPL Price Alert',
      message: 'Apple Inc. has reached your target price of $175.00',
      time: '2 minutes ago',
      read: false,
      icon: TrendingUp,
      color: 'text-bullish'
    },
    {
      id: 2,
      type: 'market_news',
      title: 'Market Update',
      message: 'Federal Reserve announces interest rate decision',
      time: '15 minutes ago',
      read: false,
      icon: DollarSign,
      color: 'text-primary'
    },
    {
      id: 3,
      type: 'trade_alert',
      title: 'Trade Executed',
      message: 'Your limit order for TSLA has been filled at $245.30',
      time: '1 hour ago',
      read: true,
      icon: CheckCircle,
      color: 'text-bullish'
    },
    {
      id: 4,
      type: 'volatility_alert',
      title: 'High Volatility Warning',
      message: 'Bitcoin experiencing unusual price movements',
      time: '2 hours ago',
      read: true,
      icon: AlertTriangle,
      color: 'text-bearish'
    },
    {
      id: 5,
      type: 'earnings',
      title: 'Earnings Report',
      message: 'Microsoft reports Q4 earnings after market close',
      time: '4 hours ago',
      read: true,
      icon: TrendingDown,
      color: 'text-muted-foreground'
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <Button variant="ghost" size="sm">
            Mark all read
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <Bell className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">No notifications</h3>
                <p className="text-sm text-muted-foreground">
                  You're all caught up! New notifications will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <Card 
                key={notification.id} 
                className={`transition-smooth hover:shadow-md cursor-pointer ${
                  !notification.read ? 'border-l-4 border-l-primary bg-card/50' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full bg-muted/50 ${notification.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-sm font-semibold">
                          {notification.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {notification.time}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};