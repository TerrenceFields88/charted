import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { MarketTicker } from '@/components/MarketTicker';
import { FeedPage } from '@/components/FeedPage';
import { MarketsPage } from '@/components/MarketsPage';
import { CreatePage } from '@/components/CreatePage';
import { NotificationsPage } from '@/components/NotificationsPage';
import { ProfilePage } from '@/components/ProfilePage';
import { UserSearchPage } from '@/components/UserSearchPage';

const Index = () => {
  const [activeTab, setActiveTab] = useState('feed');

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <FeedPage />;
      case 'markets':
        return <MarketsPage />;
      case 'create':
        return <CreatePage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <FeedPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Market Ticker */}
      <MarketTicker />
      
      <div className="max-w-md mx-auto relative">
        <div className="px-4 py-6 pb-20">
          {renderContent()}
        </div>
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;
