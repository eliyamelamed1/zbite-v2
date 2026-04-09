/**
 * Backfill script — computes recipeScore for every recipe and chefScore for every user.
 *
 * Run once after deploying the scoring schema changes:
 *   npx tsx server/src/scripts/backfill-scores.ts
 */

import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import Recipe from '../models/Recipe';
import Rating from '../models/Rating';
import User from '../models/User';
import { computeRecipeScore } from '../modules/social/social.utils';

async function backfillRecipeScores(): Promise<number> {
  const recipes = await Recipe.find({}).select('_id');
  let updated = 0;

  for (const recipe of recipes) {
    const ratings = await Rating.find({ recipe: recipe._id }).select('stars');
    const ratingsCount = ratings.length;

    if (ratingsCount === 0) continue;

    const sum = ratings.reduce((acc, r) => acc + r.stars, 0);
    const averageRating = sum / ratingsCount;
    const recipeScore = computeRecipeScore(averageRating, ratingsCount);

    await Recipe.findByIdAndUpdate(recipe._id, { recipeScore });
    updated += 1;
  }

  return updated;
}

async function backfillChefScores(): Promise<number> {
  const users = await User.find({ recipesCount: { $gt: 0 } }).select('_id');
  let updated = 0;

  for (const user of users) {
    const result = await Recipe.aggregate([
      { $match: { author: user._id } },
      { $group: { _id: null, total: { $sum: '$recipeScore' } } },
    ]);

    const chefScore = result[0]?.total ?? 0;
    await User.findByIdAndUpdate(user._id, { chefScore });
    updated += 1;
  }

  return updated;
}

async function main(): Promise<void> {
  await connectDB();

  // eslint-disable-next-line no-console
  console.log('Backfilling recipe scores...');
  const recipesUpdated = await backfillRecipeScores();
  // eslint-disable-next-line no-console
  console.log(`Updated ${recipesUpdated} recipes.`);

  // eslint-disable-next-line no-console
  console.log('Backfilling chef scores...');
  const usersUpdated = await backfillChefScores();
  // eslint-disable-next-line no-console
  console.log(`Updated ${usersUpdated} users.`);

  await mongoose.disconnect();
  // eslint-disable-next-line no-console
  console.log('Done.');
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Backfill failed:', error);
  process.exit(1);
});
