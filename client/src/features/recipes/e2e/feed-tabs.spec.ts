import { test, expect } from '../../../e2e/fixtures/auth.fixture';

import {
  registerUserViaApi,
  createRecipeViaApi,
  followUserViaApi,
  saveRecipeViaApi,
} from '../../../e2e/helpers/api-client';
import { createUserData, createRecipeData } from '../../../e2e/fixtures/test-data';

test.describe('Feed Page Tabs', () => {
  test('Feed tab shows recipes from followed users', async ({ authenticatedPage, userA }) => {
    const chef = await registerUserViaApi(createUserData('feedchef'));
    const recipeData = createRecipeData('FeedRecipe');
    await createRecipeViaApi(chef.token, recipeData);
    await followUserViaApi(userA.token, chef.id);

    await authenticatedPage.goto('/feed');

    await expect(authenticatedPage.getByText(recipeData.title).first()).toBeVisible({ timeout: 10_000 });
  });

  test('Explore tab shows recipes with sort options', async ({ authenticatedPage }) => {
    const chef = await registerUserViaApi(createUserData('explorchef'));
    await createRecipeViaApi(chef.token, createRecipeData('ExplorePill'));

    await authenticatedPage.goto('/feed?tab=explore');

    await expect(authenticatedPage.getByText('Trending')).toBeVisible();
    await expect(authenticatedPage.getByText('Recent')).toBeVisible();
    await expect(authenticatedPage.getByText('Top Rated')).toBeVisible();
  });

  test('Explore tab search input filters recipes', async ({ authenticatedPage }) => {
    const chef = await registerUserViaApi(createUserData('searchchef'));
    const recipe = await createRecipeViaApi(chef.token, createRecipeData('UniqueSearchable'));

    await authenticatedPage.goto('/feed?tab=explore');
    // Sort by recent so the new recipe is loaded into the client-side list
    await authenticatedPage.waitForLoadState('networkidle');
    await Promise.all([
      authenticatedPage.waitForResponse((resp) => resp.url().includes('/recipes/explore') && resp.url().includes('sort=recent')),
      authenticatedPage.getByRole('button', { name: 'Recent' }).click(),
    ]);
    // Verify recipe is loaded, then search to filter
    await expect(authenticatedPage.getByText(recipe.title).first()).toBeVisible({ timeout: 10_000 });
    await authenticatedPage.getByPlaceholder('Search recipes...').fill(recipe.title.slice(0, 10));

    // Wait for debounce + filter
    await authenticatedPage.waitForTimeout(500);
    await expect(authenticatedPage.getByText(recipe.title).first()).toBeVisible();
  });

  test('Saved tab shows saved recipes', async ({ authenticatedPage, userA }) => {
    const chef = await registerUserViaApi(createUserData('savechef'));
    const recipeData = createRecipeData('SavedTabRecipe');
    const recipe = await createRecipeViaApi(chef.token, recipeData);
    await saveRecipeViaApi(userA.token, recipe.id);

    await authenticatedPage.goto('/feed?tab=saved');

    await expect(authenticatedPage.getByText(recipeData.title).first()).toBeVisible({ timeout: 10_000 });
  });

  test('Saved tab shows empty state when no recipes saved', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/feed?tab=saved');

    await expect(authenticatedPage.getByText('Save more recipes')).toBeVisible();
  });

  test('switching tabs preserves URL param', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/feed');

    await authenticatedPage.getByRole('button', { name: 'Explore', exact: true }).click();
    await expect(authenticatedPage).toHaveURL(/tab=explore/);

    await authenticatedPage.getByRole('button', { name: 'Saved', exact: true }).click();
    await expect(authenticatedPage).toHaveURL(/tab=saved/);

    await authenticatedPage.getByRole('button', { name: 'Feed', exact: true }).click();
    await expect(authenticatedPage).not.toHaveURL(/tab=/);
  });

  test('/explore redirects to /feed?tab=explore', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/explore');

    await expect(authenticatedPage).toHaveURL(/feed.*tab=explore/);
  });

  test('/saved redirects to /feed?tab=saved', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/saved');

    await expect(authenticatedPage).toHaveURL(/feed.*tab=saved/);
  });
});
