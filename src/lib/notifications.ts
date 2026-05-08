import { Capacitor } from '@capacitor/core';
import { toast } from '@/hooks/use-toast';

/**
 * Cross-platform notification helper.
 * - Native (iOS/Android via Capacitor): uses LocalNotifications + PushNotifications
 * - Web: uses browser Notification API with toast fallback
 */

let initialized = false;

export const isNative = () => Capacitor.isNativePlatform();

export const initNotifications = async () => {
  if (initialized) return;
  initialized = true;

  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.requestPermissions();

      const { PushNotifications } = await import('@capacitor/push-notifications');
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive === 'granted') {
        await PushNotifications.register();
      }

      PushNotifications.addListener('registration', (token) => {
        console.log('[push] device token:', token.value);
        try { localStorage.setItem('charted_push_token', token.value); } catch {}
      });

      PushNotifications.addListener('pushNotificationReceived', (n) => {
        toast({ title: n.title || 'Charted', description: n.body });
      });
    } catch (err) {
      console.warn('[notifications] native init failed', err);
    }
    return;
  }

  // Web
  if ('Notification' in window && Notification.permission === 'default') {
    try { await Notification.requestPermission(); } catch {}
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const r = await LocalNotifications.requestPermissions();
      return r.display === 'granted';
    } catch { return false; }
  }
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const r = await Notification.requestPermission();
  return r === 'granted';
};

export const sendNotification = async (title: string, body: string) => {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [{
          id: Math.floor(Math.random() * 100000),
          title,
          body,
          schedule: { at: new Date(Date.now() + 100) },
        }],
      });
      return;
    } catch (err) {
      console.warn('[notifications] schedule failed', err);
    }
  }

  // Web
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body, icon: '/favicon.ico' }); return; } catch {}
  }
  toast({ title, description: body });
};
