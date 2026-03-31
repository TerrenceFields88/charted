import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const OfflineFallback = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <WifiOff className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">You're Offline</h2>
      <p className="text-muted-foreground mb-8 max-w-xs">
        Check your internet connection and try again to access Charted.
      </p>
      <Button
        onClick={() => window.location.reload()}
        className="gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </Button>
    </div>
  );
};
