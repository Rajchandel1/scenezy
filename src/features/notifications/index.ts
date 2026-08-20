export interface AppNotification {
  id: string; userId: string; type: string;
  title: string; body: string; icon: string;
  read: boolean; createdAt: string; link?: string;
}

export class NotificationService {
  static async getNotifications(userId: string): Promise<AppNotification[]> {
    const res = await fetch(`/api/data/notifications?userId=${userId}`);
    return res.json();
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const res = await fetch('/api/data/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unread-count', userId }),
    });
    const data = await res.json();
    return data.count || 0;
  }

  static async markRead(notifId: string): Promise<void> {
    await fetch('/api/data/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-read', notifId }),
    });
  }

  static async markAllRead(userId: string): Promise<void> {
    await fetch('/api/data/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-all-read', userId }),
    });
  }

  static async send(userId: string, title: string, body: string, icon = '🔔', type = 'info', link?: string) {
    await fetch('/api/data/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', userId, title, body, icon, type, link }),
    });
  }
}
