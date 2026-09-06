import { createHmac } from 'node:crypto';
import { afterEach,describe,expect,it } from 'vitest';
import { verifyPaymentSignature,verifyWebhookSignature } from './razorpay';

afterEach(()=>{delete process.env.RAZORPAY_KEY_SECRET;delete process.env.RAZORPAY_WEBHOOK_SECRET});
describe('Razorpay signatures',()=>{
  it('accepts only the correct payment signature',()=>{process.env.RAZORPAY_KEY_SECRET='test-secret';const signature=createHmac('sha256','test-secret').update('order_1|pay_1').digest('hex');expect(verifyPaymentSignature('order_1','pay_1',signature)).toBe(true);expect(verifyPaymentSignature('order_1','pay_2',signature)).toBe(false)});
  it('validates webhook raw bodies',()=>{process.env.RAZORPAY_WEBHOOK_SECRET='webhook-secret';const body='{"event":"payment.captured"}',signature=createHmac('sha256','webhook-secret').update(body).digest('hex');expect(verifyWebhookSignature(body,signature)).toBe(true);expect(verifyWebhookSignature(`${body}x`,signature)).toBe(false)});
});
