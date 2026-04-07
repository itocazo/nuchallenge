import { db } from '../src/db';
import { attempts } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const stuck = await db
    .select({
      id: attempts.id,
      challengeId: attempts.challengeId,
      userId: attempts.userId,
      status: attempts.status,
      submittedAt: attempts.submittedAt,
    })
    .from(attempts)
    .where(eq(attempts.status, 'evaluating'));

  console.log(`Found ${stuck.length} attempts in 'evaluating' state`);
  for (const a of stuck) {
    console.log('  ', a);
  }

  let reset = 0;
  for (const a of stuck) {
    const submittedMs = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    if (Date.now() - submittedMs > 30_000) {
      await db
        .update(attempts)
        .set({ status: 'in_progress', submittedAt: null })
        .where(eq(attempts.id, a.id));
      console.log(`  reset ${a.id} -> in_progress`);
      reset++;
    }
  }
  console.log(`Reset ${reset} attempts`);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
