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
    console.log('Current activeTab:', activeTab);
    switch (activeTab) {
      case 'feed':
        console.log('Rendering FeedPage');
        return <FeedPage />;
      case 'markets':
        console.log('Rendering MarketsPage');
        return <MarketsPage />;
      case 'create':
        console.log('Rendering CreatePage');
        return <CreatePage />;
      case 'notifications':
        console.log('Rendering NotificationsPage');
        return <NotificationsPage />;
      case 'profile':
        console.log('Rendering ProfilePage');
        return <ProfilePage />;
      default:
        console.log('Rendering default FeedPage');
        return <FeedPage />;
    }
  };

  console.log('Index component rendering, activeTab:', activeTab);

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
