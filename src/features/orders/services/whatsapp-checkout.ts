export interface WhatsAppBookingDetails {
  customerName: string;
  customerEmail: string;
  eventId: string;
  eventTitle: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  passTypeId: string;
  passTypeName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  fees: number;
  total: number;
}

export function normalizeWhatsAppNumber(value: string) {
  return value.replace(/\D/g, '');
}

const money = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

export function buildWhatsAppBookingMessage(details: WhatsAppBookingDetails) {
  const date = formatEventDate(details.date, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return [
    'Hello Scenezy,',
    '',
    'I would like to request this pass:',
    '',
    `Event: ${details.eventTitle}`,
    `Pass: ${details.passTypeName}`,
    `Quantity: ${details.quantity}`,
    details.time?`Date & time: ${date}, ${details.time}`:`Date: ${date}`,
    `Venue: ${details.venue}, ${details.location}`,
    '',
    `Price: ${money(details.unitPrice)} x ${details.quantity}`,
    `Subtotal: ${money(details.subtotal)}`,
    `Platform fee: ${money(details.fees)}`,
    `Total: ${money(details.total)}`,
    '',
    `Name: ${details.customerName}`,
    `Scenezy account: ${details.customerEmail}`,
    `Event ID: ${details.eventId}`,
    `Pass type ID: ${details.passTypeId}`,
    '',
    'Please confirm availability and share the payment steps. I understand this is a booking request and my pass will be issued only after Scenezy verifies the payment.',
  ].join('\n');
}

export function buildWhatsAppBookingUrl(phone: string, details: WhatsAppBookingDetails) {
  const number = normalizeWhatsAppNumber(phone);
  if (number.length < 10 || number.length > 15) {
    throw new Error('WhatsApp booking is temporarily unavailable. Please contact Scenezy support.');
  }
  return `https://wa.me/${number}?text=${encodeURIComponent(buildWhatsAppBookingMessage(details))}`;
}
import { formatEventDate } from '../../../shared/lib/event-date';
