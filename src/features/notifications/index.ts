export interface AppNotification {
  id: string; userId: string; type: string;
  title: string; body: string; icon: string;
  read: boolean; createdAt: string; link?: string;
}

export class NotificationService {
  static async getNotifications(userId: string): Promise<AppNotification[]> {
    return fetchClientCache(`private:notifications:${userId}`,async()=>{
      const res = await fetch(`/api/data/notifications?userId=${userId}`);
      if(!res.ok)return [];
      return res.json();
    },{freshForMs:30_000});
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return fetchClientCache(`private:notification-count:${userId}`,async()=>{
      const res = await fetch('/api/data/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unread-count', userId }),
      });
      if(!res.ok)return 0;
      const data = await res.json().catch(()=>({count:0}));
      return data.count || 0;
    },{freshForMs:30_000});
  }

  static async markRead(notifId: string): Promise<void> {
    await fetch('/api/data/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-read', notifId }),
    });
    invalidateClientCache('private:notifications:');
    invalidateClientCache('private:notification-count:');
  }

  static async markAllRead(userId: string): Promise<void> {
    await fetch('/api/data/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-all-read', userId }),
    });
    invalidateClientCache(`private:notifications:${userId}`);
    invalidateClientCache(`private:notification-count:${userId}`);
  }

  static async send(userId: string, title: string, body: string, icon = '🔔', type = 'info', link?: string) {
    await fetch('/api/data/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', userId, title, body, icon, type, link }),
    });
    invalidateClientCache(`private:notifications:${userId}`);
    invalidateClientCache(`private:notification-count:${userId}`);
  }
}
import { fetchClientCache, invalidateClientCache } from '@/shared/lib/client-data-cache';
