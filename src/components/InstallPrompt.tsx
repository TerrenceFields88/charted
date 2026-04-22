import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Share } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'charted_install_dismissed_at';
const DISMISS_DAYS = 7;

/**
 * Install prompt for PWA. Shows a native-feeling install banner on supported
 * browsers (Chrome/Edge/Android) and an iOS Safari "Add to Home Screen" hint.
 * Auto-hides inside iframes (Lovable preview) and after dismissal.
 */
export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show in iframes (Lovable preview) or already-installed apps
    const inIframe = (() => {
      try { return window.self !== window.top; } catch { return true; }
    })();
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (inIframe || isStandalone) return;

    // Respect recent dismissal
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const days = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (days < DISMISS_DAYS) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS Safari has no beforeinstallprompt — show manual hint
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isSafari = /safari/i.test(window.navigator.userAgent) && !/crios|fxios/i.test(window.navigator.userAgent);
    if (isIos && isSafari) {
      setTimeout(() => {
        setShowIosHint(true);
        setVisible(true);
      }, 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-bottom-5 fade-in duration-300">
      <Card className="p-4 shadow-2xl border-primary/20 bg-card/95 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Install Charted</p>
            {showIosHint ? (
              <p className="text-xs text-muted-foreground mt-1">
                Tap <Share className="h-3 w-3 inline mx-0.5" /> then "Add to Home Screen"
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Get the full app experience on your home screen
              </p>
            )}
            {!showIosHint && deferredPrompt && (
              <Button size="sm" onClick={handleInstall} className="mt-3 h-8">
                Install
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-8 w-8 shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
