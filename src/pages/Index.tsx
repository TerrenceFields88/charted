import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { MarketTicker } from '@/components/MarketTicker';
import { FeedPage } from '@/components/FeedPage';
import { MarketsPage } from '@/components/MarketsPage';
import { CreatePage } from '@/components/CreatePage';
import { ProfilePage } from '@/components/ProfilePage';
import { NotificationsPage } from '@/components/NotificationsPage';
import { MessagesPage } from '@/components/MessagesPage';

const Index = () => {
  const [activeTab, setActiveTab] = useState('feed');

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <FeedPage />;
      case 'markets':
        return <MarketsPage />;
      case 'messages':
        return <MessagesPage />;
      case 'create':
        return <CreatePage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <FeedPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto relative">
        {renderContent()}
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;
