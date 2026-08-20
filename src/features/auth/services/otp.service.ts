// =============================================
// OTP SERVICE - Modular Design
// =============================================
// TO SWITCH TO REAL EMAIL OTP LATER:
//   1. Set USE_REAL_OTP = true below
//   2. Implement sendRealOTP() with Nodemailer
//   Nothing else changes!
// =============================================

const USE_REAL_OTP = false; // 🔄 Change to true when email works
const DUMMY_OTP = '123456';
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// In-memory store (use Redis/DB in production)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export class OTPService {
  static async sendOTP(email: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    if (USE_REAL_OTP) {
      return await this.sendRealOTP(normalizedEmail);
    }

    // DUMMY MODE: Always use 123456
    otpStore.set(normalizedEmail, {
      otp: DUMMY_OTP,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
    });

    console.log(`[OTP] Dummy OTP for ${normalizedEmail}: ${DUMMY_OTP}`);
    return { success: true, message: 'OTP sent successfully' };
  }

  static async verifyOTP(email: string, otp: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const stored = otpStore.get(normalizedEmail);

    if (!stored) return false;
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(normalizedEmail);
      return false;
    }
    if (stored.otp !== otp) return false;

    // Valid OTP - clean up
    otpStore.delete(normalizedEmail);
    return true;
  }

  // Placeholder for real email implementation
  private static async sendRealOTP(email: string): Promise<{ success: boolean; message: string }> {
    // TODO: Use Nodemailer here when ready
    // const otp = generateOTP();
    // await sendEmail(email, 'Reset Password', passwordResetEmail(name, otp));
    // otpStore.set(email, { otp, expiresAt: Date.now() + OTP_EXPIRY_MS });
    return { success: false, message: 'Real OTP not implemented yet' };
  }
}
