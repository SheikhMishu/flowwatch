// PIN utilities
import bcrypt from "bcryptjs";

export function generatePin(): string {
  // 6-digit numeric PIN
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export function pinExpiresAt(): Date {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
}
