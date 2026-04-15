/**
 * Migration script — recomputes systemTags on all existing recipes.
 * This populates `cat:` category tags based on ingredient keyword scanning.
 *
 * Run once after deploying the category auto-tagging changes:
 *   npx tsx server/src/scripts/recompute-system-tags.ts
 */

import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import Recipe from '../models/Recipe';

const BATCH_LOG_INTERVAL = 50;

async function recomputeAllSystemTags(): Promise<number> {
  const recipes = await Recipe.find({});
  let updated = 0;

  for (let i = 0; i < recipes.length; i++) {
    // Calling .save() triggers the pre('save') hook which recomputes systemTags
    await recipes[i].save();
    updated += 1;

    if ((i + 1) % BATCH_LOG_INTERVAL === 0) {
      process.stdout.write(`  ${i + 1}/${recipes.length} recipes recomputed\n`);
    }
  }

  return updated;
}

async function main(): Promise<void> {
  await connectDB();

  // eslint-disable-next-line no-console
  console.log('Recomputing system tags (including category auto-tags)...');
  const updated = await recomputeAllSystemTags();
  // eslint-disable-next-line no-console
  console.log(`Recomputed system tags for ${updated} recipes.`);

  await mongoose.disconnect();
  // eslint-disable-next-line no-console
  console.log('Done.');
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Migration failed:', error);
  process.exit(1);
});
