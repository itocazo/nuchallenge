/**
 * Database seed script
 * Run with: npx tsx src/db/seed.ts
 *
 * Seeds the database with challenges and demo users from the seed data.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { SEED_CHALLENGES, SEED_USERS } from '../lib/data';

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log('Seeding challenges...');
  for (const challenge of SEED_CHALLENGES) {
    await db
      .insert(schema.challenges)
      .values({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        instructions: challenge.instructions,
        tags: challenge.tags,
        difficulty: challenge.difficulty,
        timeMinutes: challenge.timeMinutes,
        pointsBase: challenge.pointsBase,
        submissionFormat: challenge.submissionFormat,
        evaluationMethod: challenge.evaluationMethod,
        rubric: challenge.rubric,
        antiCheatTier: challenge.antiCheatTier,
        prerequisites: challenge.prerequisites,
        producesAsset: challenge.producesAsset,
        assetType: challenge.assetType,
        hints: challenge.hints,
        active: challenge.active,
      })
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${SEED_CHALLENGES.length} challenges seeded`);

  console.log('Seeding users...');
  for (const user of SEED_USERS) {
    await db
      .insert(schema.users)
      .values({
        id: user.id.length < 36
          ? `00000000-0000-0000-0000-00000000000${user.id.replace('u', '')}`
          : user.id,
        email: user.email,
        name: user.name,
        department: user.department,
        title: user.title,
        interests: user.interests,
        level: user.level,
        levelName: user.levelName,
        pointsTotal: user.pointsTotal,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        badges: user.badges,
        passwordHash: 'demo', // Phase 1 only
      })
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${SEED_USERS.length} users seeded`);

  console.log('Done!');
}

seed().catch(console.error);
