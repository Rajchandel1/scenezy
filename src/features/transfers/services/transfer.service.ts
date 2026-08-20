import { Transfer, CreateTransferInput, ClaimTransferInput } from '../types';
import { PassService } from '@/features/passes';

const TRANSFERS_KEY = 'pass_transfers';
const TRANSFER_EXPIRY_HOURS = 48;

function getTransfers(): Transfer[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(TRANSFERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveTransfers(transfers: Transfer[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TRANSFERS_KEY, JSON.stringify(transfers));
  }
}

function generateNewCredential(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'PASS_';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export class TransferService {
  /**
   * Create transfer - pass stays ACTIVE with sender until claimed
   * Sender can still use/cancel the pass
   */
  static async createTransfer(input: CreateTransferInput): Promise<Transfer> {
    const transfers = getTransfers();

    // Check existing pending transfer for this pass
    const existingPending = transfers.find(
      t => t.passId === input.passId && t.status === 'PENDING'
    );
    if (existingPending) {
      throw new Error('This pass already has a pending transfer. Cancel it first.');
    }

    // Verify pass exists and is active
    const pass = await PassService.getPassById(input.passId);
    if (!pass) throw new Error('Pass not found');
    if (pass.status !== 'ACTIVE') throw new Error('Pass is not active');
    if (pass.ownerUserId !== input.senderUserId) throw new Error('You do not own this pass');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + TRANSFER_EXPIRY_HOURS * 60 * 60 * 1000);

    const transfer: Transfer = {
      id: `trf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      passId: input.passId,
      senderUserId: input.senderUserId,
      senderName: input.senderName,
      recipientIdentifier: input.recipientIdentifier.toLowerCase().trim(),
      recipientUserId: null,
      status: 'PENDING',
      eventTitle: input.eventTitle,
      passTypeName: input.passTypeName,
      eventDate: input.eventDate,
      eventTime: input.eventTime,
      eventLocation: input.eventLocation,
      eventVenue: input.eventVenue,
      createdAt: now.toISOString(),
      claimedAt: null,
      expiresAt: expiresAt.toISOString(),
    };

    transfers.push(transfer);
    saveTransfers(transfers);
    return transfer;
  }

  /**
   * Get pending transfers FOR a user (by their email/identifier)
   * This is what shows "You have 1 pass to claim" in wallet
   */
  static async getPendingClaimsForUser(userIdentifier: string): Promise<Transfer[]> {
    const transfers = getTransfers();
    const now = new Date();

    return transfers.filter(t => {
      if (t.status !== 'PENDING') return false;
      if (t.recipientIdentifier !== userIdentifier.toLowerCase().trim()) return false;
      if (new Date(t.expiresAt) < now) {
        // Mark as expired
        t.status = 'EXPIRED';
        saveTransfers(transfers);
        return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * ATOMIC CLAIM
   * 1. Verify transfer is PENDING
   * 2. Verify recipient identifier matches
   * 3. Verify not expired
   * 4. Verify recipient != sender
   * 5. Update pass ownership
   * 6. Generate new credential (old one dies)
   * 7. Mark transfer CLAIMED
   */
  static async claimTransfer(input: ClaimTransferInput): Promise<{ success: boolean; message: string; passId?: string }> {
    const transfers = getTransfers();
    const transferIdx = transfers.findIndex(t => t.id === input.transferId);

    if (transferIdx === -1) {
      return { success: false, message: 'Transfer not found' };
    }

    const transfer = transfers[transferIdx];

    // Verify still pending
    if (transfer.status !== 'PENDING') {
      if (transfer.status === 'CLAIMED') return { success: false, message: 'This pass has already been claimed' };
      if (transfer.status === 'EXPIRED') return { success: false, message: 'This transfer has expired' };
      if (transfer.status === 'CANCELLED') return { success: false, message: 'This transfer was cancelled by the sender' };
    }

    // Verify identifier matches
    if (transfer.recipientIdentifier !== input.recipientIdentifier.toLowerCase().trim()) {
      return { success: false, message: 'This transfer is not for your account' };
    }

    // Verify not expired
    if (new Date(transfer.expiresAt) < new Date()) {
      transfer.status = 'EXPIRED';
      saveTransfers(transfers);
      return { success: false, message: 'This transfer has expired' };
    }

    // Verify not self-claim
    if (transfer.senderUserId === input.recipientUserId) {
      return { success: false, message: 'You cannot claim your own transfer' };
    }

    // === ATOMIC OWNERSHIP SWAP ===
    const passesKey = 'pass_user_passes';
    const passes = JSON.parse(localStorage.getItem(passesKey) || '[]');
    const passIdx = passes.findIndex((p: any) => p.id === transfer.passId);

    if (passIdx === -1) {
      return { success: false, message: 'Pass no longer exists' };
    }

    const pass = passes[passIdx];
    if (pass.status !== 'ACTIVE') {
      return { success: false, message: 'This pass is no longer available' };
    }

    // 1. Transfer ownership
    pass.ownerUserId = input.recipientUserId;

    // 2. NEW credential (old one becomes invalid)
    pass.credential = generateNewCredential();

    // 3. Save pass
    passes[passIdx] = pass;
    localStorage.setItem(passesKey, JSON.stringify(passes));

    // 4. Mark transfer claimed
    transfer.status = 'CLAIMED';
    transfer.recipientUserId = input.recipientUserId;
    transfer.claimedAt = new Date().toISOString();
    transfers[transferIdx] = transfer;
    saveTransfers(transfers);

    return { success: true, message: 'Pass is now yours!', passId: transfer.passId };
  }

  /**
   * Cancel pending transfer (sender gets full control back)
   */
  static async cancelTransfer(transferId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const transfers = getTransfers();
    const idx = transfers.findIndex(t => t.id === transferId);

    if (idx === -1) return { success: false, message: 'Transfer not found' };
    if (transfers[idx].senderUserId !== userId) return { success: false, message: 'Not authorized' };
    if (transfers[idx].status !== 'PENDING') return { success: false, message: 'Cannot cancel this transfer' };

    transfers[idx].status = 'CANCELLED';
    saveTransfers(transfers);
    return { success: true, message: 'Transfer cancelled. Pass is fully yours again.' };
  }

  /**
   * Get pending transfer for a specific pass
   */
  static async getPendingTransferForPass(passId: string): Promise<Transfer | null> {
    const transfers = getTransfers();
    return transfers.find(t => t.passId === passId && t.status === 'PENDING') || null;
  }

  /**
   * Get all sent transfers by user
   */
  static async getSentTransfers(userId: string): Promise<Transfer[]> {
    const transfers = getTransfers();
    return transfers.filter(t => t.senderUserId === userId).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}
