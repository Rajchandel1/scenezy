import { SellerEvent, CreateEventInput } from '../types';

export class ApiSellerService {
  static async getDashboard(sellerId: string) {
    const res = await fetch(`/api/data/seller?action=dashboard&sellerId=${sellerId}`);
    return res.json();
  }

  static async getEvents(sellerId: string, tab = 'active') {
    const res = await fetch(`/api/data/seller?action=events&sellerId=${sellerId}&tab=${tab}`);
    return res.json();
  }

  static async getEventDetail(sellerId: string, eventId: string) {
    const res = await fetch(`/api/data/seller?action=event-detail&sellerId=${sellerId}&eventId=${eventId}`);
    return res.json();
  }

  static async getActivity(sellerId: string) {
    const res = await fetch(`/api/data/seller?action=activity&sellerId=${sellerId}`);
    return res.json();
  }

  static async createEvent(input: CreateEventInput): Promise<SellerEvent> {
    const res = await fetch('/api/data/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create event');
    }
    return res.json();
  }

  static async isApproved(userId: string): Promise<boolean> {
    const res = await fetch('/api/data/admin?action=sellers');
    const sellers = await res.json();
    const seller = sellers.find((s: any) => s.id === userId);
    return seller?.approved === true;
  }
}
