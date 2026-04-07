import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function main() {
  const cols = await db.execute(
    sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='point_transactions' ORDER BY ordinal_position`
  );
  console.log('point_transactions columns:');
  for (const row of cols.rows ?? []) console.log(' -', row);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
