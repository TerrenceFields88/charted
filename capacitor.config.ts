import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.0257cb44f3674f7081c02d1669f7d11a',
  appName: 'Charted',
  webDir: 'dist',
  // For local dev/hot-reload, uncomment the server block below and point to your sandbox URL.
  // For App Store / Play Store production builds, leave it commented so the bundled `dist/` is used.
  // server: {
  //   url: 'https://0257cb44-f367-4f70-81c0-2d1669f7d11a.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0b',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0b'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'Charted'
  },
  android: {
    backgroundColor: '#0a0a0b',
    allowMixedContent: true
  }
};

export default config;
