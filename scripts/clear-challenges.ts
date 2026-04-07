import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });
  await db.delete(schema.pointTransactions);
  console.log('  cleared point_transactions');
  await db.delete(schema.assets);
  console.log('  cleared assets');
  await db.delete(schema.attempts);
  console.log('  cleared attempts');
  await db.delete(schema.challenges);
  console.log('  cleared challenges');
  console.log('Done.');
}

run().catch(console.error);
