import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './src/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  const sqlClient = neon(process.env.DATABASE_URL!);
  const db = drizzle(sqlClient, { schema });

  await db.execute(sql`DELETE FROM point_transactions`);
  console.log('✓ Cleared point_transactions');

  await db.execute(sql`DELETE FROM audit_log`);
  console.log('✓ Cleared audit_log');

  await db.execute(sql`DELETE FROM streak_events`);
  console.log('✓ Cleared streak_events');

  await db.execute(sql`DELETE FROM attempts`);
  console.log('✓ Cleared attempts');

  await db.execute(sql`
    UPDATE users
    SET points_total = 0, level = 1, level_name = 'Novice', current_streak = 0
    WHERE email = 'sofia@nubank.com'
  `);
  console.log('✓ Reset Sofia stats');
}

main().catch(e => { console.error(e); process.exit(1); });
