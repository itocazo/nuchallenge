import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './src/db/schema';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });
  
  try {
    await db.insert(schema.users).values({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'sofia@nubank.com',
      name: 'Sofia Mendes',
      passwordHash: 'demo',
      department: 'Product Management',
      title: 'Product Manager',
      interests: ['Prompt Engineering', 'Product Thinking', 'Strategy'],
      level: 2,
      levelName: 'Contributor',
      pointsTotal: 2450,
      currentStreak: 7,
      longestStreak: 12,
      badges: ['First Steps', 'Speed Demon'],
      challengeStats: { total: 50, completed: 12, inProgress: 1 }
    }).onConflictDoNothing();
    
    console.log('✓ Sofia seeded');
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

main();
