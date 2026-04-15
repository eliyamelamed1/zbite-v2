import { test, expect } from '../../../e2e/fixtures/auth.fixture';

import {
  registerUserViaApi,
  createRecipeViaApi,
  followUserViaApi,
} from '../../../e2e/helpers/api-client';
import { createUserData, createRecipeData } from '../../../e2e/fixtures/test-data';
import { FeedPage } from '../../../e2e/pages/FeedPage';

test.describe('Feed Page — Unified Explore', () => {
  test('sort dropdown is visible on the feed page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/feed');

    // The sort dropdown trigger should be visible
    const trigger = authenticatedPage.locator('[aria-haspopup="listbox"]');
    await expect(trigger).toBeVisible();

    // Open dropdown and verify options exist
    await trigger.click();
    await expect(authenticatedPage.getByRole('option').filter({ hasText: 'Trending' })).toBeVisible();
    await expect(authenticatedPage.getByRole('option').filter({ hasText: 'Recent' })).toBeVisible();
    await expect(authenticatedPage.getByRole('option').filter({ hasText: 'Top Rated' })).toBeVisible();
  });

  test('Following sort shows recipes from followed users', async ({ authenticatedPage, userA }) => {
    const chef = await registerUserViaApi(createUserData('feedchef'));
    const recipeData = createRecipeData('FeedRecipe');
    await createRecipeViaApi(chef.token, recipeData);
    await followUserViaApi(userA.token, chef.id);

    const feed = new FeedPage(authenticatedPage);
    await feed.goto();
    await feed.selectSort('Following');

    await expect(authenticatedPage.getByText(recipeData.title).first()).toBeVisible({ timeout: 10_000 });
  });

  test('/explore redirects to /feed', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/explore');

    await expect(authenticatedPage).toHaveURL(/\/feed/);
  });

  test('/saved redirects to /feed', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/saved');

    await expect(authenticatedPage).toHaveURL(/\/feed/);
  });
});
