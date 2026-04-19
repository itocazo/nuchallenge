/**
 * Database seed script
 * Run with: npx tsx src/db/seed.ts
 *
 * Seeds the database with challenges, demo users, and admin user.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import { SEED_CHALLENGES, SEED_USERS } from '../lib/data';
import { generatePassword, hashPassword } from '../lib/services/password';
import { sendWelcomeEmail } from '../lib/services/email';

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log('Seeding challenges...');
  for (const challenge of SEED_CHALLENGES) {
    // Guided-flow metadata is stashed in `contextTemplate` to avoid a schema
    // migration. The advance endpoint reads back `{ flow, guidedConfig }`
    // from this column.
    const contextTemplate = challenge.flow
      ? { flow: challenge.flow, guidedConfig: challenge.guidedConfig ?? null }
      : null;

    const values = {
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
      contextTemplate,
      hints: challenge.hints,
      active: challenge.active,
    };
    await db
      .insert(schema.challenges)
      .values(values)
      .onConflictDoUpdate({
        target: schema.challenges.id,
        set: {
          title: values.title,
          description: values.description,
          instructions: values.instructions,
          tags: values.tags,
          difficulty: values.difficulty,
          timeMinutes: values.timeMinutes,
          pointsBase: values.pointsBase,
          submissionFormat: values.submissionFormat,
          evaluationMethod: values.evaluationMethod,
          rubric: values.rubric,
          antiCheatTier: values.antiCheatTier,
          prerequisites: values.prerequisites,
          producesAsset: values.producesAsset,
          assetType: values.assetType,
          contextTemplate: values.contextTemplate,
          hints: values.hints,
          active: values.active,
        },
      });
  }
  console.log(`  ✓ ${SEED_CHALLENGES.length} challenges seeded`);

  console.log('Seeding demo users...');
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
        passwordHash: 'demo', // Demo users use 'demo' as password
      })
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${SEED_USERS.length} demo users seeded`);

  // Seed admin user: Jardel Itocazo
  console.log('Seeding admin user...');
  const adminEmail = 'jardell@gmail.com';
  const [existingAdmin] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail))
    .limit(1);

  if (!existingAdmin) {
    const adminPassword = generatePassword();
    const adminHash = await hashPassword(adminPassword);

    await db.insert(schema.users).values({
      email: adminEmail,
      name: 'Jardel Itocazo',
      department: 'Engineering',
      title: 'Platform Admin',
      platformRole: ['challenger', 'admin'],
      level: 1,
      levelName: 'Novice',
      pointsTotal: 0,
      currentStreak: 0,
      longestStreak: 0,
      badges: [],
      interests: [],
      passwordHash: adminHash,
    });

    await sendWelcomeEmail({
      to: adminEmail,
      name: 'Jardel Itocazo',
      password: adminPassword,
    });

    console.log(`  ✓ Admin user created (${adminEmail})`);
  } else {
    // Ensure existing user has admin role
    await db
      .update(schema.users)
      .set({ platformRole: ['challenger', 'admin'] })
      .where(eq(schema.users.email, adminEmail));
    console.log(`  ✓ Admin role ensured for ${adminEmail}`);
  }

  console.log('Done!');
}

seed().catch(console.error);
