import { Order } from '../types';
import { PassService } from '@/features/passes';
import { NotificationService } from '@/features/notifications';

export class ApiOrderService {
  static async createAndPayOrder(input: {
    userId: string;
    eventId: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    eventVenue: string;
    items: { passTypeId: string; passTypeName: string; quantity: number; unitPrice: number }[];
  }): Promise<{ order: Order; success: boolean; message?: string }> {
    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 5% random failure
    if (Math.random() < 0.05) {
      return { success: false, message: 'Payment declined by bank. Please try again.', order: {} as Order };
    }

    const subtotal = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const fees = Math.round(subtotal * 0.05);
    const total = subtotal + fees;

    // Create order
    const orderRes = await fetch('/api/data/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: input.userId,
        eventId: input.eventId,
        eventTitle: input.eventTitle,
        items: input.items.map(i => ({ ...i, total: i.unitPrice * i.quantity })),
        subtotal, fees, total,
        paymentStatus: 'SUCCESS',
        orderStatus: 'PAID',
      }),
    });
    const order = await orderRes.json();

    // Create passes
    const passInputs = [];
    for (const item of input.items) {
      for (let i = 0; i < item.quantity; i++) {
        passInputs.push({
          eventId: input.eventId,
          eventTitle: input.eventTitle,
          passTypeId: item.passTypeId,
          passTypeName: item.passTypeName,
          price: item.unitPrice,
          ownerUserId: input.userId,
          eventDate: input.eventDate,
          eventTime: input.eventTime,
          eventLocation: input.eventLocation,
          eventVenue: input.eventVenue,
        });
      }
    }
    await PassService.createMultiplePasses(passInputs);

    // 🔔 Send purchase notification
    const totalPasses = input.items.reduce((s, i) => s + i.quantity, 0);
    await NotificationService.send(
      input.userId,
      'Pass Purchased! 🎉',
      `You got ${totalPasses} pass(es) for ${input.eventTitle}. Show QR at entry!`,
      '🎫',
      'purchase',
      '/passes'
    );

    return { order, success: true, message: 'Payment successful!' };
  }

  static async getOrdersByUser(userId: string): Promise<Order[]> {
    const res = await fetch(`/api/data/orders?userId=${userId}`);
    return res.json();
  }
}
