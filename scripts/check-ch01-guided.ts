import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '../src/db/schema';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });
  const [row] = await db
    .select({
      id: schema.challenges.id,
      title: schema.challenges.title,
      evalMethod: schema.challenges.evaluationMethod,
      contextTemplate: schema.challenges.contextTemplate,
    })
    .from(schema.challenges)
    .where(eq(schema.challenges.id, 'CH-01'))
    .limit(1);
  console.log(JSON.stringify(row, null, 2));
}
main().catch(console.error);
