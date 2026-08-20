import { Order, OrderItem, OrderStatus, PaymentStatus } from '../types';
import { paymentProvider } from './payment.service';
import { PassService, CreatePassInput } from '@/features/passes';

const ORDERS_KEY = 'pass_user_orders';

function getOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(ORDERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveOrders(orders: Order[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }
}

export class OrderService {
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
    // Calculate totals
    const subtotal = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const fees = Math.round(subtotal * 0.05); // 5% platform fee
    const total = subtotal + fees;

    // Create order
    const order: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: input.userId,
      eventId: input.eventId,
      eventTitle: input.eventTitle,
      items: input.items.map(item => ({
        ...item,
        total: item.unitPrice * item.quantity,
      })),
      subtotal,
      fees,
      total,
      paymentStatus: 'PENDING',
      orderStatus: 'CREATED',
      createdAt: new Date().toISOString(),
    };

    // Process payment
    const paymentResult = await paymentProvider.processPayment(total, 'INR');

    if (!paymentResult.success) {
      order.paymentStatus = 'FAILED';
      order.orderStatus = 'FAILED';
      const orders = getOrders();
      orders.push(order);
      saveOrders(orders);
      return { order, success: false, message: paymentResult.message };
    }

    // Payment success - create passes
    order.paymentStatus = 'SUCCESS';
    order.orderStatus = 'PAID';

    const passInputs: CreatePassInput[] = [];
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

    // Save order
    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);

    return { order, success: true, message: 'Payment successful! Your passes are ready.' };
  }

  static async getOrdersByUser(userId: string): Promise<Order[]> {
    const orders = getOrders();
    return orders.filter(o => o.userId === userId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}
