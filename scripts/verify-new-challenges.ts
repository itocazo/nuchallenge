/**
 * Verify the three new auto-graded challenges exist in the database
 * and have the expected grader config in their rubric.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { inArray } from 'drizzle-orm';
import * as schema from '../src/db/schema';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  const ids = ['CH-07', 'CH-09', 'CH-13', 'CH-19', 'CH-20', 'CH-21'];
  const rows = await db
    .select({
      id: schema.challenges.id,
      title: schema.challenges.title,
      evaluationMethod: schema.challenges.evaluationMethod,
      rubric: schema.challenges.rubric,
    })
    .from(schema.challenges)
    .where(inArray(schema.challenges.id, ids));

  for (const id of ids) {
    const row = rows.find((r) => r.id === id);
    if (!row) {
      console.log(`✗ ${id} NOT FOUND`);
      continue;
    }
    const rubric = row.rubric as { grader?: { type: string } };
    const graderType = rubric.grader?.type ?? 'NONE';
    console.log(
      `✓ ${id} | ${row.evaluationMethod} | grader=${graderType} | "${row.title}"`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
