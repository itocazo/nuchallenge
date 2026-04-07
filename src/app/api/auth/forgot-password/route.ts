import { NextRequest } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { db } from '@/db';
import { users, passwordResetTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { sendPasswordResetEmail } from '@/lib/services/email';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const { email } = schema.parse(await req.json());

    // Always return the same response to prevent email enumeration
    const genericOk = jsonResponse({ message: 'If that email exists, a reset link has been sent.' });

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) return genericOk;

    // Invalidate any existing unused tokens for this user
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, user.id));

    // Generate a secure token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    await sendPasswordResetEmail({ to: user.email, name: user.name, token });

    return genericOk;
  } catch (error) {
    return handleApiError(error);
  }
}
