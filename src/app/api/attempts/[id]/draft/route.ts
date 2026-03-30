import { NextRequest } from 'next/server';
import { db } from '@/db';
import { attempts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { saveDraftSchema } from '@/lib/validators/challenges';
import { handleApiError, requireAuth } from '@/lib/api-utils';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = saveDraftSchema.parse(await req.json());

    // Verify attempt belongs to user and is in progress
    const result = await db
      .update(attempts)
      .set({ draftText: body.draftText })
      .where(
        and(
          eq(attempts.id, id),
          eq(attempts.userId, user.id!),
          eq(attempts.status, 'in_progress')
        )
      )
      .returning({ id: attempts.id });

    if (result.length === 0) {
      return new Response(null, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
