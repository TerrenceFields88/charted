import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.0257cb44f3674f7081c02d1669f7d11a',
  appName: 'charted',
  webDir: 'dist',
  server: {
    url: "https://0257cb44-f367-4f70-81c0-2d1669f7d11a.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;