import { describe, expect, it } from 'vitest';
import { buildWhatsAppBookingMessage, buildWhatsAppBookingUrl, normalizeWhatsAppNumber } from './whatsapp-checkout';

const booking = {
  customerName: 'Raj',
  customerEmail: 'raj@example.com',
  eventId: 'event-1',
  eventTitle: 'Scenezy Night',
  date: '2026-09-20',
  time: '20:00',
  venue: 'Riverfront',
  location: 'Ahmedabad',
  passTypeId: 'pass-1',
  passTypeName: 'General',
  quantity: 2,
  unitPrice: 500,
  subtotal: 1000,
  fees: 50,
  total: 1050,
};

describe('WhatsApp checkout', () => {
  it('normalizes Indian phone formatting', () => {
    expect(normalizeWhatsAppNumber('+91 92654 61135')).toBe('919265461135');
  });

  it('builds a complete booking message without losing identifiers', () => {
    const message = buildWhatsAppBookingMessage(booking);
    expect(message).toContain('Event: Scenezy Night');
    expect(message).toContain('Quantity: 2');
    expect(message).toContain('Total: ₹1,050');
    expect(message).toContain('Event ID: event-1');
    expect(message).toContain('Pass type ID: pass-1');
  });

  it('creates an encoded wa.me URL and rejects invalid numbers', () => {
    expect(buildWhatsAppBookingUrl('+91 92654 61135', booking)).toMatch(/^https:\/\/wa\.me\/919265461135\?text=/);
    expect(() => buildWhatsAppBookingUrl('123', booking)).toThrow('WhatsApp booking is temporarily unavailable');
  });
});
