import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { users } from '../src/db/schema';
import { hashPassword } from '../src/lib/services/password';

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema: { users } });
  const hash = await hashPassword('admin1234');
  await db.update(users).set({ passwordHash: hash }).where(eq(users.email, 'jardell@gmail.com'));
  console.log('Password reset to: admin1234');
}

run().catch(console.error);
