import { PolicyPage } from '@/shared/components/legal/PolicyPage';

export default function CancellationRefundPolicyPage() {
  return <PolicyPage eyebrow="Booking policy" title="Cancellation & Refund Policy" updated="8 September 2026" sections={[
    { title: 'Customer cancellations', body: 'Event tickets are normally final after payment is verified and the digital pass is issued. Customer-initiated cancellations, changes of plan, missed events, late arrival, failure to meet venue rules, or partially used bookings are not eligible for a refund unless the event listing expressly states otherwise.' },
    { title: 'Cancelled events', body: 'If an organizer cancels an event without a replacement date, purchasers are eligible for a refund of the amount paid for that booking. Scenezy will communicate the available resolution using the registered account details. Refunds are returned only to the original payment method; cash refunds are not issued.' },
    { title: 'Rescheduled events', body: 'A ticket remains valid for the announced replacement date. If the organizer permits refunds for the rescheduled event, the request window and instructions will be stated in the rescheduling notice.' },
    { title: 'Failed or duplicate payments', body: 'A failed payment does not create a confirmed ticket. Banks or payment gateways may automatically reverse a failed debit. For a duplicate debit or a successful payment without ticket delivery, contact Scenezy with the transaction reference, order ID and registered email so the payment can be verified.' },
    { title: 'Request and processing timeline', body: 'Send an eligible request to scenezyin@gmail.com within 7 calendar days of the cancellation announcement or disputed transaction. After verification, approved refunds are initiated to the original payment method. Banks and payment providers generally take 5–10 working days after initiation to reflect the credit; actual timing can vary by payment method and bank.' },
    { title: 'Contact', body: 'Email: scenezyin@gmail.com\nPhone: +91 92654 61135\nService type: Online event-ticketing platform' },
  ]}/>;
}
