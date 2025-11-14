interface VerificationData {
  code: string;
  email: string;
  name: string;
  password: string;
  mobile?: string;
  expiresAt: number;
}

// In-memory store for verification codes
// In production, consider using Redis for better scalability
const verificationStore = new Map<string, VerificationData>();

const EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

// Clean up expired codes periodically
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of verificationStore.entries()) {
    if (data.expiresAt < now) {
      verificationStore.delete(email);
    }
  }
}, 60 * 1000); // Clean up every minute

export const storeVerificationCode = (
  email: string,
  code: string,
  userData: { name: string; password: string; mobile?: string }
): void => {
  verificationStore.set(email, {
    code,
    email,
    name: userData.name,
    password: userData.password,
    mobile: userData.mobile,
    expiresAt: Date.now() + EXPIRATION_TIME,
  });
};

export const verifyCode = (email: string, code: string): VerificationData | null => {
  const data = verificationStore.get(email);

  if (!data) {
    return null;
  }

  // Check if code has expired
  if (data.expiresAt < Date.now()) {
    verificationStore.delete(email);
    return null;
  }

  // Check if code matches
  if (data.code !== code) {
    return null;
  }

  // Code is valid, return the data
  return data;
};

export const deleteVerificationCode = (email: string): void => {
  verificationStore.delete(email);
};

export const hasVerificationCode = (email: string): boolean => {
  const data = verificationStore.get(email);
  if (!data) return false;

  // Check if expired
  if (data.expiresAt < Date.now()) {
    verificationStore.delete(email);
    return false;
  }

  return true;
};
