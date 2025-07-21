import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { FeedPage } from '@/components/FeedPage';
import { MarketsPage } from '@/components/MarketsPage';
import { CreatePage } from '@/components/CreatePage';
import { CommunityPage } from '@/components/CommunityPage';
import { ProfilePage } from '@/components/ProfilePage';

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
      case 'community':
        return <CommunityPage />;
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
