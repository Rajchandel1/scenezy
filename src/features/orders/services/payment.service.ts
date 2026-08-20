import { PaymentResult, PaymentStatus } from '../types';

/**
 * Mock Payment Provider
 * Simulates payment with configurable delay and outcome.
 * Replace with Razorpay/Stripe later by implementing same interface.
 */
export interface PaymentProvider {
  processPayment(amount: number, currency: string): Promise<PaymentResult>;
}

export class MockPaymentProvider implements PaymentProvider {
  private delayMs: number;
  private failureRate: number;

  constructor(delayMs = 1500, failureRate = 0.1) {
    this.delayMs = delayMs;
    this.failureRate = failureRate;
  }

  async processPayment(amount: number, currency: string): Promise<PaymentResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, this.delayMs));

    const transactionId = `txn_mock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    // Simulate random failure
    if (Math.random() < this.failureRate) {
      return {
        success: false,
        transactionId,
        status: 'FAILED',
        message: 'Payment declined by bank. Please try again.',
      };
    }

    return {
      success: true,
      transactionId,
      status: 'SUCCESS',
      message: 'Payment successful',
    };
  }
}

// 🔥 Switch provider here later
export const paymentProvider: PaymentProvider = new MockPaymentProvider(1500, 0.05);
