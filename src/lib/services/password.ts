import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export function generatePassword(length = 16): string {
  return randomBytes(length).toString('base64url').slice(0, length);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  // Support legacy 'demo' passwords from Phase 1
  if (hash === 'demo') return plain === 'demo';
  return bcrypt.compare(plain, hash);
}
