import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { users, passwordResetTokens } from '@/db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { hashPassword } from '@/lib/services/password';

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const { token, password } = schema.parse(await req.json());

    // Look up a valid (unused, non-expired) token
    const [record] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!record) {
      return errorResponse('Reset link is invalid or has expired.', 400);
    }

    const hash = await hashPassword(password);

    // Update password and mark token used in parallel
    await Promise.all([
      db
        .update(users)
        .set({ passwordHash: hash, updatedAt: new Date() })
        .where(eq(users.id, record.userId)),
      db
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, record.id)),
    ]);

    return jsonResponse({ message: 'Password updated. You can now sign in.' });
  } catch (error) {
    return handleApiError(error);
  }
}
