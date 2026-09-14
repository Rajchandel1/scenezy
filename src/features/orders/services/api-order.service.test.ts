import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiOrderService } from './api-order.service';

describe('ApiOrderService response handling', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(() => 'checkout-key-123456'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('turns an empty checkout error into a useful message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 500 })));

    await expect(ApiOrderService.createOrder({
      eventId: 'event-id',
      items: [{ passTypeId: 'pass-type-id', quantity: 1 }],
    })).rejects.toThrow('Checkout service is temporarily unavailable (server returned 500)');
  });

  it('turns malformed verification output into a useful message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>Bad gateway</html>', { status: 502 })));

    await expect(ApiOrderService.verifyPayment({
      razorpay_order_id: 'order-id',
      razorpay_payment_id: 'payment-id',
      razorpay_signature: 'signature',
    })).rejects.toThrow('Payment verification service is temporarily unavailable (invalid server response)');
  });
});
