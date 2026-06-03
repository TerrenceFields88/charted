import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { CommodityTicker } from '@/components/CommodityTicker';
import { FeedPage } from '@/components/FeedPage';
import { MarketsPage } from '@/components/MarketsPage';
import { CreatePage } from '@/components/CreatePage';
import { ProfilePage } from '@/components/ProfilePage';
import { MessagesPage } from '@/components/MessagesPage';
import { AIAnalystPage } from '@/components/AIAnalystPage';
import { TradeJournalPage } from '@/components/TradeJournalPage';
import { LearnPage } from '@/components/LearnPage';
import { WatchlistPage } from '@/components/WatchlistPage';
import { AICoachPage } from '@/components/AICoachPage';
import { PredictionsPage } from '@/components/PredictionsPage';

const Index = () => {
  const [activeTab, setActiveTab] = useState('feed');

  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent<string>).detail;
      if (typeof tab === 'string') setActiveTab(tab);
    };
    window.addEventListener('charted:nav', handler);
    return () => window.removeEventListener('charted:nav', handler);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'feed': return <FeedPage />;
      case 'markets': return <MarketsPage />;
      case 'messages': return <MessagesPage />;
      case 'create': return <CreatePage />;
      case 'analyst': return <AIAnalystPage />;
      case 'journal': return <TradeJournalPage />;
      case 'learn': return <LearnPage />;
      case 'watchlist': return <WatchlistPage />;
      case 'coach': return <AICoachPage />;
      case 'profile': return <ProfilePage />;
      default: return <FeedPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto relative min-h-screen">
        <div className="sticky top-0 z-50">
          <CommodityTicker />
        </div>
        {renderContent()}
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;
