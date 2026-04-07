import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { and, eq } from 'drizzle-orm';
import * as schema from './src/db/schema';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });
  const result = await db.delete(schema.attempts).where(
    and(
      eq(schema.attempts.userId, '00000000-0000-0000-0000-000000000001'),
      eq(schema.attempts.challengeId, 'CH-01')
    )
  );
  console.log('✓ Cleared Sofia attempts for CH-01');
}
main().catch(e => { console.error(e); process.exit(1); });
