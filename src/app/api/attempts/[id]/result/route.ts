import { NextRequest } from 'next/server';
import { db } from '@/db';
import { attempts, challenges, pointTransactions, users } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { jsonResponse, errorResponse, handleApiError, requireAuth } from '@/lib/api-utils';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const [attempt] = await db
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.id, id),
          eq(attempts.userId, user.id!)
        )
      )
      .limit(1);

    if (!attempt) {
      return errorResponse('Attempt not found', 404);
    }

    // If still evaluating, return status
    if (attempt.status === 'evaluating' || attempt.status === 'submitted') {
      return jsonResponse({
        attemptId: attempt.id,
        status: attempt.status,
        evaluating: true,
      });
    }

    // Get challenge info
    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, attempt.challengeId))
      .limit(1);

    // Get point transactions for this attempt
    const txs = await db
      .select()
      .from(pointTransactions)
      .where(eq(pointTransactions.attemptId, id));

    // Real breakdown: base (challenge_complete) + each bonus type +
    // any human-applied appeal_adjustment rows. These always sum to
    // pointsAwarded, so the UI can render a ledger that actually ties out.
    //
    // Note: appeal_adjustment rows are produced by admin/evaluator score
    // overrides and there can be more than one per attempt (multiple
    // reviewers, or a follow-up adjustment). We sum them and surface the
    // most recent reason.
    const baseAmount = txs.find((b) => b.type === 'challenge_complete')?.amount ?? 0;
    const qualityAmount = txs.find((b) => b.type === 'quality_bonus')?.amount ?? 0;
    const speedAmount = txs.find((b) => b.type === 'speed_bonus')?.amount ?? 0;
    const streakAmount = txs.find((b) => b.type === 'streak_bonus')?.amount ?? 0;

    // Human-touched rows: corrective adjustments (appeal_adjustment) and
    // additive reviewer credit (manual_bonus). We expose them as separate
    // ledger lines so the UI can show "Reviewer bonus +5 by Maria" alongside
    // "Reviewer adjustment -3 by Carlos".
    const tsOf = (row: { createdAt: Date | null }) =>
      row.createdAt ? new Date(row.createdAt).getTime() : 0;

    const reviewerRows = txs
      .filter((b) => b.type === 'appeal_adjustment' || b.type === 'manual_bonus')
      .sort((a, b) => tsOf(a) - tsOf(b));

    // Resolve reviewer names in one shot
    const reviewerIds = Array.from(
      new Set(reviewerRows.map((r) => r.awardedByUserId).filter((v): v is string => !!v))
    );
    const reviewerLookup = new Map<string, string>();
    if (reviewerIds.length) {
      const rows = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, reviewerIds));
      for (const r of rows) reviewerLookup.set(r.id, r.name);
    }

    const stripPrefix = (s: string | null) =>
      s ? s.replace(/^(Admin score override|Reviewer bonus|Reviewer adjustment):\s*/i, '') : null;

    const reviewerEntries = reviewerRows.map((row) => ({
      id: row.id,
      kind: row.type === 'manual_bonus' ? ('bonus' as const) : ('adjustment' as const),
      amount: row.amount,
      reason: stripPrefix(row.description),
      reviewerName: row.awardedByUserId ? reviewerLookup.get(row.awardedByUserId) ?? null : null,
      createdAt: row.createdAt,
    }));

    const adjustmentAmount = reviewerRows
      .filter((r) => r.type === 'appeal_adjustment')
      .reduce((sum, row) => sum + row.amount, 0);
    const manualBonusAmount = reviewerRows
      .filter((r) => r.type === 'manual_bonus')
      .reduce((sum, row) => sum + row.amount, 0);

    // Backwards-compat: keep humanAdjustment as the most recent reviewer
    // touch so the existing card keeps rendering during the cutover.
    const lastReviewerRow = reviewerRows.length ? reviewerRows[reviewerRows.length - 1] : null;
    const humanAdjustmentReason = stripPrefix(lastReviewerRow?.description ?? null);

    const bonusMap = {
      quality: qualityAmount,
      speed: speedAmount,
      streak: streakAmount,
    };

    const scoreBreakdown = {
      base: baseAmount,
      qualityBonus: qualityAmount,
      speedBonus: speedAmount,
      streakBonus: streakAmount,
      humanAdjustment: adjustmentAmount + manualBonusAmount,
      humanAdjustmentReason,
      reviewerEntries,
      total:
        baseAmount +
        qualityAmount +
        speedAmount +
        streakAmount +
        adjustmentAmount +
        manualBonusAmount,
      challengeMaxBase: challenge?.pointsBase ?? null,
    };

    // Count remaining attempts
    const allAttempts = await db
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.userId, user.id!),
          eq(attempts.challengeId, attempt.challengeId)
        )
      );

    return jsonResponse({
      attemptId: attempt.id,
      challengeId: attempt.challengeId,
      challengeTitle: challenge?.title,
      status: attempt.status,
      qualityScore: attempt.qualityScore ? Number(attempt.qualityScore) : null,
      pointsAwarded: attempt.pointsAwarded,
      evaluation: attempt.evaluationResult,
      bonuses: bonusMap,
      scoreBreakdown,
      attemptsRemaining: Math.max(0, 3 - allAttempts.length),
      evaluating: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
