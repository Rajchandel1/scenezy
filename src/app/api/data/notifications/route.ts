import { NextRequest } from 'next/server';
import { readJson, writeJson, generateId } from '@/shared/lib/json-db';

interface Notification {
  id: string; userId: string; type: string;
  title: string; body: string; icon: string;
  read: boolean; createdAt: string; link?: string;
}
interface NotifFile { notifications: Notification[]; }

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return Response.json([]);

  const data = readJson<NotifFile>('notifications.json');
  const userNotifs = data.notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return Response.json(userNotifs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;
  const data = readJson<NotifFile>('notifications.json');

  if (action === 'create') {
    const notif: Notification = {
      id: generateId('notif'),
      userId: body.userId,
      type: body.type || 'info',
      title: body.title,
      body: body.body,
      icon: body.icon || '🔔',
      read: false,
      createdAt: new Date().toISOString(),
      link: body.link,
    };
    data.notifications.push(notif);
    writeJson('notifications.json', data);
    return Response.json(notif);
  }

  if (action === 'mark-read') {
    const idx = data.notifications.findIndex(n => n.id === body.notifId);
    if (idx !== -1) {
      data.notifications[idx].read = true;
      writeJson('notifications.json', data);
    }
    return Response.json({ success: true });
  }

  if (action === 'mark-all-read') {
    data.notifications.forEach(n => {
      if (n.userId === body.userId) n.read = true;
    });
    writeJson('notifications.json', data);
    return Response.json({ success: true });
  }

  if (action === 'unread-count') {
    const count = data.notifications.filter(n => n.userId === body.userId && !n.read).length;
    return Response.json({ count });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}
