import { useEffect } from 'react';

/**
 * Hook to initialize native mobile features and gestures.
 * Handles safe areas, viewport units, and prevents default zoom on inputs.
 */
export const useNativeFeatures = () => {
  useEffect(() => {
    // Fix viewport height for mobile browsers (100vh issue)
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);

    // Prevent pinch-to-zoom on the entire app (native app behavior)
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', preventZoom, { passive: false });

    // Prevent double-tap zoom on iOS
    let lastTap = 0;
    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTap < 300) {
        e.preventDefault();
      }
      lastTap = now;
    };
    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });

    // Prevent font-size zoom on input focus (iOS)
    const metaViewport = document.querySelector('meta[name=viewport]');
    if (metaViewport) {
      metaViewport.setAttribute('content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      );
    }

    return () => {
      window.removeEventListener('resize', setVH);
      document.removeEventListener('touchmove', preventZoom);
      document.removeEventListener('touchend', preventDoubleTapZoom);
    };
  }, []);
};
