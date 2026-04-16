/**
 * Seed script — populates the database with 500 real recipes from TheMealDB.
 * Wipes ALL existing data, then creates 12 chef personas, loads recipes
 * from data/recipes.json, and generates synthetic social interactions.
 *
 * Run: npx tsx src/scripts/seed-recipes.ts
 */

import mongoose from 'mongoose';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { connectDB } from '../config/db';
import User from '../models/User';
import Recipe from '../models/Recipe';
import Follow from '../models/Follow';
import SavedRecipe from '../models/SavedRecipe';
import { computeRecipeScore } from '../modules/social/social.utils';

import type { IRecipe } from '../shared/types';

/* ========================================================================= */
/*  Types                                                                    */
/* ========================================================================= */

interface SeedUser {
  readonly username: string;
  readonly email: string;
  readonly bio: string;
  readonly interests: readonly string[];
  readonly avatar: string;
}

interface SeedRecipe {
  title: string;
  description: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  cookingTime: number;
  servings: number;
  ingredients: { name: string; amount: string }[];
  steps: { order: number; title: string; instruction: string }[];
  nutrition: { calories: number; protein: number; carbs: number; fat: number };
  coverImage: string;
}

/* ========================================================================= */
/*  Constants                                                                */
/* ========================================================================= */

const SEED_PASSWORD = 'SeedPass123';
const DATA_PATH = join(__dirname, 'data', 'recipes.json');

/** Probability thresholds for social data generation. */
const SAVE_PROBABILITY = 0.6;
const MIN_SAVERS = 2;
const MAX_SAVERS = 8;
const MIN_FOLLOWS_PER_USER = 3;
const MAX_FOLLOWS_PER_USER = 6;
const BATCH_LOG_INTERVAL = 50;

/** Seed avatar URLs using DiceBear pixel-art API. */
const AVATAR_BASE = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=';

/** The system user that owns all seed recipes. */
const SYSTEM_USER: SeedUser = {
  username: 'zbite',
  email: 'system@zbite.com',
  bio: 'The official zbite kitchen — 500 curated recipes from around the world.',
  interests: ['Italian', 'Asian', 'Healthy', 'Dessert', 'Seafood'],
  avatar: `${AVATAR_BASE}zbite`,
};

/** Community users that provide social interactions (saves, follows). */
const COMMUNITY_USERS: readonly SeedUser[] = [
  { username: 'chef_mario', email: 'mario@zbite.com', bio: 'Italian chef passionate about fresh pasta and traditional recipes.', interests: ['Italian', 'Pasta', 'Baking'], avatar: `${AVATAR_BASE}mario` },
  { username: 'baker_anna', email: 'anna@zbite.com', bio: 'Pastry chef who believes every meal should end with dessert.', interests: ['Baking', 'Dessert', 'French'], avatar: `${AVATAR_BASE}anna` },
  { username: 'vegan_sam', email: 'sam@zbite.com', bio: 'Plant-powered cooking for a healthier planet.', interests: ['Vegan', 'Vegetarian', 'Healthy'], avatar: `${AVATAR_BASE}sam` },
  { username: 'seafood_nina', email: 'nina@zbite.com', bio: 'From the coast to your plate — fresh seafood daily.', interests: ['Seafood', 'Mediterranean', 'Greek'], avatar: `${AVATAR_BASE}nina` },
  { username: 'chef_lee', email: 'lee@zbite.com', bio: 'Bringing authentic Asian flavors to home kitchens.', interests: ['Asian', 'Chinese', 'Thai'], avatar: `${AVATAR_BASE}lee` },
  { username: 'healthy_alex', email: 'alex@zbite.com', bio: 'Clean eating, big flavors. Meal prep enthusiast.', interests: ['Healthy', 'Quick Meals', 'Salad'], avatar: `${AVATAR_BASE}alex` },
  { username: 'chef_carlos', email: 'carlos@zbite.com', bio: 'Spice and soul — Latin and American comfort food.', interests: ['Mexican', 'Caribbean', 'American'], avatar: `${AVATAR_BASE}carlos` },
  { username: 'chef_raj', email: 'raj@zbite.com', bio: 'Aromatic spices and rich curries from the subcontinent.', interests: ['Indian', 'Middle Eastern', 'Vegetarian'], avatar: `${AVATAR_BASE}raj` },
  { username: 'chef_pierre', email: 'pierre@zbite.com', bio: 'Classic French technique meets modern plating.', interests: ['French', 'Mediterranean', 'Dessert'], avatar: `${AVATAR_BASE}pierre` },
  { username: 'chef_yuki', email: 'yuki@zbite.com', bio: 'Japanese precision and Korean boldness in every dish.', interests: ['Japanese', 'Korean', 'Asian'], avatar: `${AVATAR_BASE}yuki` },
  { username: 'grill_master', email: 'grill@zbite.com', bio: 'Fire, smoke, and perfectly seared protein.', interests: ['Beef', 'Chicken', 'American', 'Pork'], avatar: `${AVATAR_BASE}grill` },
  { username: 'chef_sofia', email: 'sofia@zbite.com', bio: 'Lamb, olive oil, and the flavors of the eastern Mediterranean.', interests: ['Lamb', 'Middle Eastern', 'Mediterranean'], avatar: `${AVATAR_BASE}sofia` },
];

/* ========================================================================= */
/*  Helpers                                                                  */
/* ========================================================================= */

/** Simple deterministic hash for consistent pseudo-random assignment. */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Deterministic integer in [min, max] inclusive based on seed + offset. */
function seededInt(seed: number, offset: number, min: number, max: number): number {
  const combined = ((seed + offset) * 2654435761) >>> 0;
  return min + (combined % (max - min + 1));
}

/* ========================================================================= */
/*  Database operations                                                      */
/* ========================================================================= */

async function wipeDatabase(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) return;
  const collections = await db.listCollections().toArray();
  for (const { name } of collections) {
    await db.collection(name).deleteMany({});
  }
}

interface SeedUserIds {
  systemUserId: mongoose.Types.ObjectId;
  allUserIds: mongoose.Types.ObjectId[];
}

async function createSeedUser(userData: SeedUser): Promise<mongoose.Types.ObjectId> {
  const user = await User.create({
    username: userData.username,
    email: userData.email,
    passwordHash: SEED_PASSWORD,
    bio: userData.bio,
    interests: [...userData.interests],
    avatar: userData.avatar,
  });
  return user._id as mongoose.Types.ObjectId;
}

async function createSeedUsers(): Promise<SeedUserIds> {
  const systemUserId = await createSeedUser(SYSTEM_USER);
  const communityIds: mongoose.Types.ObjectId[] = [];
  for (const userData of COMMUNITY_USERS) {
    communityIds.push(await createSeedUser(userData));
  }
  return { systemUserId, allUserIds: [systemUserId, ...communityIds] };
}

async function createSeedRecipes(
  recipes: SeedRecipe[],
  systemUserId: mongoose.Types.ObjectId,
): Promise<mongoose.Types.ObjectId[]> {
  const recipeIds: mongoose.Types.ObjectId[] = [];

  for (let i = 0; i < recipes.length; i++) {
    const seed = recipes[i];

    const recipe = await Recipe.create({
      title: seed.title,
      description: seed.description,
      author: systemUserId,
      tags: seed.tags,
      difficulty: seed.difficulty,
      cookingTime: seed.cookingTime,
      servings: seed.servings,
      ingredients: seed.ingredients,
      steps: seed.steps,
      nutrition: seed.nutrition,
      coverImage: seed.coverImage,
      status: 'published',
    });
    recipeIds.push(recipe._id as mongoose.Types.ObjectId);

    if ((i + 1) % BATCH_LOG_INTERVAL === 0) {
      process.stdout.write(`  ${i + 1}/${recipes.length} recipes created\n`);
    }
  }

  await User.findByIdAndUpdate(systemUserId, { recipesCount: recipes.length });

  return recipeIds;
}

/* ========================================================================= */
/*  Social data generation                                                   */
/* ========================================================================= */

async function createSeedSaves(
  userIds: mongoose.Types.ObjectId[],
  recipeIds: mongoose.Types.ObjectId[],
): Promise<void> {
  for (let r = 0; r < recipeIds.length; r++) {
    const seed = hashString(recipeIds[r].toString() + 'saves');
    const shouldSave = (seed % 100) < (SAVE_PROBABILITY * 100);
    if (!shouldSave) continue;

    const recipe = await Recipe.findById(recipeIds[r]).select('author');
    if (!recipe) continue;

    const saverCount = seededInt(seed, 1, MIN_SAVERS, MAX_SAVERS);
    const savers = new Set<number>();
    let attempts = 0;

    while (savers.size < saverCount && attempts < 50) {
      const idx = seededInt(seed, attempts + 10, 0, userIds.length - 1);
      if (!userIds[idx].equals(recipe.author as mongoose.Types.ObjectId)) {
        savers.add(idx);
      }
      attempts++;
    }

    for (const idx of savers) {
      await SavedRecipe.create({ user: userIds[idx], recipe: recipeIds[r] });
    }

    const savesCount = savers.size;
    const recipeScore = computeRecipeScore({ savesCount, commentsCount: 0, reportsCount: 0 });
    await Recipe.findByIdAndUpdate(recipeIds[r], { savesCount, recipeScore });

    if ((r + 1) % BATCH_LOG_INTERVAL === 0) {
      process.stdout.write(`  ${r + 1}/${recipeIds.length} recipes saved\n`);
    }
  }
}

async function createSeedFollows(userIds: mongoose.Types.ObjectId[]): Promise<void> {
  for (let i = 0; i < userIds.length; i++) {
    const seed = hashString(userIds[i].toString() + 'follows');
    const followCount = seededInt(seed, 0, MIN_FOLLOWS_PER_USER, MAX_FOLLOWS_PER_USER);
    const followed = new Set<number>();
    let attempts = 0;

    while (followed.size < followCount && attempts < 30) {
      const idx = seededInt(seed, attempts + 300, 0, userIds.length - 1);
      if (idx !== i) followed.add(idx);
      attempts++;
    }

    for (const idx of followed) {
      await Follow.create({ follower: userIds[i], following: userIds[idx] });
      await User.findByIdAndUpdate(userIds[i], { $inc: { followingCount: 1 } });
      await User.findByIdAndUpdate(userIds[idx], { $inc: { followersCount: 1 } });
    }
  }
}

async function backfillChefScores(userIds: mongoose.Types.ObjectId[]): Promise<void> {
  for (const userId of userIds) {
    const result = await Recipe.aggregate([
      { $match: { author: userId } },
      { $group: { _id: null, total: { $sum: '$recipeScore' } } },
    ]);
    const chefScore = result[0]?.total ?? 0;
    await User.findByIdAndUpdate(userId, { chefScore });
  }
}

/* ========================================================================= */
/*  Main                                                                     */
/* ========================================================================= */

async function main(): Promise<void> {
  await connectDB();

  const recipesJson = readFileSync(DATA_PATH, 'utf-8');
  const recipes: SeedRecipe[] = JSON.parse(recipesJson);

  process.stdout.write(`Loaded ${recipes.length} recipes from data/recipes.json\n\n`);
  process.stdout.write('Wiping database...\n');
  await wipeDatabase();

  process.stdout.write('Creating seed users (1 system + 12 community)...\n');
  const { systemUserId, allUserIds } = await createSeedUsers();
  process.stdout.write(`  Created ${allUserIds.length} users (system: zbite).\n\n`);

  process.stdout.write('Creating seed recipes (all under zbite)...\n');
  const recipeIds = await createSeedRecipes(recipes, systemUserId);
  process.stdout.write(`  Created ${recipeIds.length} recipes.\n\n`);

  process.stdout.write('Generating saves...\n');
  await createSeedSaves(allUserIds, recipeIds);
  process.stdout.write('Generating follows...\n');
  await createSeedFollows(allUserIds);

  process.stdout.write('\nBackfilling chef scores...\n');
  await backfillChefScores(allUserIds);

  process.stdout.write('\n✓ Seed complete!\n');
  process.stdout.write(`  ${allUserIds.length} users, ${recipeIds.length} recipes (all by @zbite)\n`);
  process.stdout.write('  Saves and follows generated.\n');

  await mongoose.disconnect();
}

main().catch((error: unknown) => {
  process.stderr.write(`Seed failed: ${error}\n`);
  process.exit(1);
});
