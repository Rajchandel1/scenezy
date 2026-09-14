import { PolicyPage } from '@/shared/components/legal/PolicyPage';

export default function PrivacyPage() {
  return <PolicyPage eyebrow="Legal" title="Privacy Policy" updated="8 September 2026" sections={[
    { title: 'Information we collect', body: 'We process account details such as name and email, booking and ticket records, payment status and transaction references, event-entry records, and information you send to support. Organizers may also provide event information and payout contact details.' },
    { title: 'How we use information', body: 'We use this information to authenticate accounts, process bookings, deliver digital passes, validate entry, operate transfers, prevent fraud, support customers and organizers, maintain transaction records, and comply with applicable obligations.' },
    { title: 'Payments', body: 'Payment credentials are collected and processed by the payment gateway displayed at checkout. Scenezy does not store card numbers, UPI PINs or net-banking passwords. We retain payment status and transaction references needed to identify and support a booking.' },
    { title: 'Organizer and service-provider access', body: 'An organizer can access attendee and scan information necessary to operate only their own events. We may use hosting, database, authentication, storage and payment service providers to run Scenezy. Access is limited to what is required to provide those services.' },
    { title: 'Retention and security', body: 'We retain records for booking fulfilment, support, fraud prevention, financial reconciliation and legal compliance. We apply role-based access controls and reasonable technical safeguards. No online system can guarantee absolute security, so never share a ticket QR, password or claim link publicly.' },
    { title: 'Your requests', body: 'To request access, correction or deletion assistance for your account information, email scenezyin@gmail.com. Some transaction or audit records may need to be retained where required for legitimate business or legal purposes.' },
  ]}/>;
}
