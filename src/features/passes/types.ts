export type PassStatus = 'ACTIVE' | 'USED' | 'REVOKED' | 'EXPIRED';

export interface Pass {
  id: string;
  eventId: string;
  eventTitle: string;
  passTypeId: string;
  passTypeName: string;
  price: number;
  ownerUserId: string;
  status: PassStatus;
  credential: string;
  createdAt: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventVenue: string;
}

export interface CreatePassInput {
  eventId: string;
  eventTitle: string;
  passTypeId: string;
  passTypeName: string;
  price: number;
  ownerUserId: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventVenue: string;
}
