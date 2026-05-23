// PIN utilities
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

export function generatePin(): string {
  return randomInt(100000, 1000000).toString();
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
