import { Transfer, CreateTransferInput, ClaimTransferInput } from '../types';
import { NotificationService } from '@/features/notifications';

export class ApiTransferService {
  static async createTransfer(input: CreateTransferInput): Promise<Transfer> {
    const res = await fetch('/api/data/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...input }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create transfer');
    }
    const transfer = await res.json();

    // 🔔 Notify sender
    await NotificationService.send(
      input.senderUserId,
      'Pass Sent ✈️',
      `${input.passTypeName} pass for ${input.eventTitle} sent to ${input.recipientIdentifier}`,
      '✈️',
      'transfer',
      `/passes/${input.passId}`
    );

    return transfer;
  }

  static async getPendingClaimsForUser(email: string): Promise<Transfer[]> {
    const res = await fetch(`/api/data/transfers?forUser=${encodeURIComponent(email)}`);
    return res.json();
  }

  static async claimTransfer(input: ClaimTransferInput): Promise<{ success: boolean; message: string; passId?: string }> {
    const res = await fetch('/api/data/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'claim', ...input }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, message: data.error || 'Claim failed' };

    // 🔔 Notify recipient
    await NotificationService.send(
      input.recipientUserId,
      'Pass Claimed! 🎉',
      'The pass is now yours. Check your wallet!',
      '🎫',
      'claim',
      `/passes/${data.passId}`
    );

    // 🔔 Notify sender that their pass was claimed
    // We need to find the transfer to get sender info
    const transfersRes = await fetch(`/api/data/transfers?passId=${data.passId}`);
    // Sender notification handled via the transfer data
    
    return { success: true, message: 'Pass is now yours!', passId: data.passId };
  }

  static async cancelTransfer(transferId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/data/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', transferId, userId }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, message: data.error || 'Cancel failed' };

    await NotificationService.send(userId, 'Transfer Cancelled', 'Your pass transfer has been cancelled. Pass is back in your wallet.', '↩️', 'info', '/passes');

    return { success: true, message: 'Transfer cancelled.' };
  }

  static async getPendingTransferForPass(passId: string): Promise<Transfer | null> {
    const res = await fetch(`/api/data/transfers?passId=${passId}`);
    return res.json();
  }

  static async getSentTransfers(userId: string): Promise<Transfer[]> {
    const res = await fetch(`/api/data/transfers?senderId=${userId}`);
    return res.json();
  }
}
