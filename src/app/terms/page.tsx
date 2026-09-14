import { PolicyPage } from '@/shared/components/legal/PolicyPage';

export default function TermsPage() {
  return <PolicyPage eyebrow="Legal" title="Terms & Conditions" updated="8 September 2026" sections={[
    { title: 'Using Scenezy', body: 'You must provide accurate account information and keep your account secure. Digital passes, QR credentials and transfer links must not be copied, resold, manipulated or used fraudulently.' },
    { title: 'Event listings', body: 'Events are created by organizers and reviewed before publication. Dates, timings, venue rules, age restrictions and entry requirements displayed on the event page form part of your booking. Organizers remain responsible for conducting their events.' },
    { title: 'Pricing and payment', body: 'Ticket prices are displayed in Indian Rupees (INR). The selected ticket quantity, applicable platform fee and final payable total are shown before payment. Payments are processed by the payment gateway presented at checkout; Scenezy does not store your card, UPI PIN or net-banking credentials.' },
    { title: 'Booking and ticket delivery', body: 'A booking is confirmed only after payment is successfully verified. Scenezy then issues the digital ticket to the purchaser’s My Passes wallet. The ticket QR is presented at the event entrance. If payment succeeds but a ticket is not visible, check Orders and contact Scenezy with the order ID and registered email address.' },
    { title: 'Entry and transfers', body: 'Admission requires an active, unused pass and remains subject to the event’s published rules. Used, revoked or expired passes cannot be admitted. Where transfers are enabled, the original QR becomes invalid after the recipient successfully claims the pass.' },
    { title: 'Cancellations and refunds', body: 'Bookings are governed by the Cancellation & Refund Policy displayed on Scenezy. Please read it before payment.' },
    { title: 'Support', body: 'For booking, payment, delivery, transfer or account assistance, email scenezyin@gmail.com or call +91 92654 61135. Include the relevant order ID whenever possible.' },
  ]}/>;
}
