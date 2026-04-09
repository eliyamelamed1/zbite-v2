import { test, expect } from '../../../e2e/fixtures/auth.fixture';

import { registerUserViaApi, createRecipeViaApi } from '../../../e2e/helpers/api-client';
import { createUserData, createRecipeData } from '../../../e2e/fixtures/test-data';
import { RecipeDetailPage } from '../../../e2e/pages/RecipeDetailPage';

/** Helper: wait for all API calls to finish, scroll to ingredients, then click +/- via JS. */
async function clickServingsButton(page: typeof import('@playwright/test').Page.prototype, name: string): Promise<void> {
  const btn = page.getByRole('button', { name });
  await btn.evaluate((el) => (el as HTMLButtonElement).click());
}

test.describe('Recipe Scaling', () => {
  test('adjusting servings up updates ingredient amounts on screen', async ({ authenticatedPage }) => {
    const chef = await registerUserViaApi(createUserData('scalechef'));
    const recipeData = createRecipeData('Scalable');
    const recipe = await createRecipeViaApi(chef.token, recipeData);
    const detail = new RecipeDetailPage(authenticatedPage);

    await detail.goto(recipe.id);

    // Wait for full page load (all API calls settle) before interacting
    await authenticatedPage.waitForLoadState('networkidle');
    await expect(authenticatedPage.getByText('400g Spaghetti')).toBeVisible({ timeout: 10_000 });
    await authenticatedPage.getByText('400g Spaghetti').scrollIntoViewIfNeeded();

    await clickServingsButton(authenticatedPage, 'Increase servings');
    await expect(authenticatedPage.getByText('500g Spaghetti')).toBeVisible({ timeout: 5_000 });
  });

  test('resetting to original servings restores original amounts', async ({ authenticatedPage }) => {
    const chef = await registerUserViaApi(createUserData('resetchef'));
    const recipeData = createRecipeData('Resettable');
    const recipe = await createRecipeViaApi(chef.token, recipeData);
    const detail = new RecipeDetailPage(authenticatedPage);

    await detail.goto(recipe.id);

    // Wait for full page load (all API calls settle) before interacting
    await authenticatedPage.waitForLoadState('networkidle');
    await expect(authenticatedPage.getByText('400g')).toBeVisible({ timeout: 10_000 });
    await authenticatedPage.getByText('400g').scrollIntoViewIfNeeded();

    await clickServingsButton(authenticatedPage, 'Increase servings');
    await expect(authenticatedPage.getByText('500g')).toBeVisible({ timeout: 5_000 });
    await clickServingsButton(authenticatedPage, 'Decrease servings');

    // Should be back to original 400g
    await expect(authenticatedPage.getByText('400g')).toBeVisible({ timeout: 5_000 });
  });
});
