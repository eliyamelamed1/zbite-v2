/**
 * Playwright global setup/teardown — cleans up E2E test data from MongoDB.
 * Identifies test data by the _test_ marker prefix in usernames and recipe titles.
 * Runs both BEFORE and AFTER the test suite to ensure clean state.
 */
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDir, '../../../server/.env') });

const TEST_MARKER = '_t_';
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/zbite';

/** Collections that reference users or recipes and need cascade cleanup. */
const RELATED_COLLECTIONS = [
  'follows',
  'likes',
  'comments',
  'ratings',
  'savedrecipes',
  'notifications',
  'shoppinglists',
  'cookingreports',
  'collections',
  'achievements',
  'cookingstreaks',
] as const;

/** User-referencing fields found across related collections. */
const USER_FIELDS = ['user', 'follower', 'following', 'recipient', 'sender', 'author'] as const;

async function cleanTestData(): Promise<void> {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();

    // Find all test users and recipes by marker prefix
    const testUsers = await db.collection('users').find({ username: { $regex: TEST_MARKER } }).toArray();
    const testUserIds = testUsers.map((u) => u._id);

    const testRecipes = await db.collection('recipes').find({ title: { $regex: `^${TEST_MARKER}` } }).toArray();
    const testRecipeIds = testRecipes.map((r) => r._id);

    if (testUserIds.length === 0 && testRecipeIds.length === 0) return;

    // Build $or conditions for cascade deletion
    const userConditions = USER_FIELDS.map((field) => ({ [field]: { $in: testUserIds } }));
    const recipeCondition = { recipe: { $in: testRecipeIds } };
    const deleteFilter = { $or: [...userConditions, recipeCondition] };

    // Cascade delete from all related collections
    const collections = await db.listCollections().toArray();
    const collectionNames = new Set(collections.map((c) => c.name));

    for (const collection of RELATED_COLLECTIONS) {
      if (collectionNames.has(collection)) {
        await db.collection(collection).deleteMany(deleteFilter);
      }
    }

    // Delete test recipes and users
    if (testRecipeIds.length > 0) {
      await db.collection('recipes').deleteMany({ _id: { $in: testRecipeIds } });
    }
    if (testUserIds.length > 0) {
      await db.collection('users').deleteMany({ _id: { $in: testUserIds } });
    }

    // eslint-disable-next-line no-console
    console.log(`[E2E cleanup] Removed ${testUsers.length} test users, ${testRecipes.length} test recipes`);
  } finally {
    await client.close();
  }
}

export default cleanTestData;
