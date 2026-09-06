export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
export type OrderStatus = 'CREATED' | 'PAID' | 'FAILED';

export interface Order {
  id: string;
  userId: string;
  eventId: string;
  eventTitle: string;
  items: OrderItem[];
  subtotal: number;
  fees: number;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
}

export interface OrderItem {
  passTypeId: string;
  passTypeName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  status: PaymentStatus;
  message?: string;
}
