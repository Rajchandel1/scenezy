'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NotificationService, AppNotification } from '@/features/notifications';
import { authService } from '@/features/auth';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [userId, setUserId] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    authService.getCurrentUser().then(u => {
      if (u) {
        setUserId(u.id);
        loadNotifs(u.id);
      }
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => loadCount(userId), 10000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadCount = async (uid: string) => {
    const c = await NotificationService.getUnreadCount(uid);
    setCount(c);
  };

  const loadNotifs = async (uid: string) => {
    const n = await NotificationService.getNotifications(uid);
    setNotifs(n);
    loadCount(uid);
  };

  const handleOpen = async () => {
    setOpen(!open);
    if (!open && userId) await loadNotifs(userId);
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    await NotificationService.markAllRead(userId);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setCount(0);
  };

  const handleNotifClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await NotificationService.markRead(notif.id);
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      setCount(prev => Math.max(0, prev - 1));
    }
    setOpen(false);
    if (notif.link) window.location.href = notif.link;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={handleOpen} className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-800 transition-colors">
        <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] h-[18px] bg-[#c4f000] text-black text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-11 w-80 max-h-96 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <h3 className="text-white text-sm font-semibold">Notifications</h3>
            {count > 0 && (
              <button onClick={handleMarkAllRead} className="text-[#c4f000] text-[11px] font-medium hover:underline">Mark all read</button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-72">
            {notifs.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-neutral-600 text-sm">No notifications</p>
              </div>
            ) : (
              notifs.slice(0, 10).map(notif => (
                <button key={notif.id} onClick={() => handleNotifClick(notif)}
                  className={`w-full text-left px-4 py-3 border-b border-neutral-800/50 hover:bg-neutral-800/50 transition-colors ${!notif.read ? 'bg-[#c4f000]/5' : ''}`}>
                  <div className="flex items-start gap-2.5">
                    <span className="text-base mt-0.5">{notif.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${!notif.read ? 'text-white' : 'text-neutral-400'}`}>{notif.title}</p>
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">{notif.body}</p>
                      <p className="text-[9px] text-neutral-600 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                    {!notif.read && <div className="w-2 h-2 bg-[#c4f000] rounded-full mt-1.5 shrink-0" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
