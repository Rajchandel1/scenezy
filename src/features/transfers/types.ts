export type TransferStatus = 'PENDING' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';

export interface Transfer {
  id: string;
  passId: string;
  senderUserId: string;
  senderName: string;
  recipientIdentifier: string; // email or phone
  recipientUserId: string | null; // filled when they claim
  status: TransferStatus;
  eventTitle: string;
  passTypeName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventVenue: string;
  createdAt: string;
  claimedAt: string | null;
  expiresAt: string;
}

export interface CreateTransferInput {
  passId: string;
  senderUserId: string;
  senderName: string;
  recipientIdentifier: string;
  eventTitle: string;
  passTypeName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventVenue: string;
}

export interface ClaimTransferInput {
  transferId: string;
  recipientUserId: string;
  recipientName: string;
  recipientIdentifier: string;
}
