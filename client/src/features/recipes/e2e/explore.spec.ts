import { test, expect } from '../../../e2e/fixtures/auth.fixture';

import { registerUserViaApi, createRecipeViaApi } from '../../../e2e/helpers/api-client';
import { createUserData, createRecipeData } from '../../../e2e/fixtures/test-data';
import { ExplorePage } from '../../../e2e/pages/ExplorePage';
import { RecipeDetailPage } from '../../../e2e/pages/RecipeDetailPage';
import { Navbar } from '../../../e2e/pages/components/Navbar';

test.describe('Explore', () => {
  test('explore page shows recipes', async ({ authenticatedPage }) => {
    const chef = await registerUserViaApi(createUserData('explorchef'));
    const recipeData = createRecipeData('Explorable');
    await createRecipeViaApi(chef.token, recipeData);
    const explore = new ExplorePage(authenticatedPage);

    await explore.goto();
    await explore.sortByRecent();

    await explore.expectRecipeVisible(recipeData.title);
  });

  test('clicking a recipe navigates to detail', async ({ authenticatedPage }) => {
    const chef = await registerUserViaApi(createUserData('detailchef'));
    const recipeData = createRecipeData('Clickable');
    await createRecipeViaApi(chef.token, recipeData);
    const explore = new ExplorePage(authenticatedPage);

    await explore.goto();
    await explore.sortByRecent();
    await explore.clickRecipe(recipeData.title);

    const detail = new RecipeDetailPage(authenticatedPage);
    await detail.expectTitleVisible(recipeData.title);
  });

  test('search finds users', async ({ authenticatedPage }) => {
    const targetUser = await registerUserViaApi(createUserData('findable'));
    const navbar = new Navbar(authenticatedPage);

    await navbar.search(targetUser.username);

    await navbar.clickSearchResult(`@${targetUser.username}`);
    await expect(authenticatedPage.getByText(`@${targetUser.username}`).first()).toBeVisible();
  });

  test('clicking heart on explore card saves the recipe', async ({ authenticatedPage }) => {
    const chef = await registerUserViaApi(createUserData('heartchef'));
    const recipeData = createRecipeData('Saveable');
    await createRecipeViaApi(chef.token, recipeData);
    const explore = new ExplorePage(authenticatedPage);

    await explore.goto();
    await explore.sortByRecent();
    await explore.expectRecipeVisible(recipeData.title);

    // Click the heart button on the first card
    const heartBtn = authenticatedPage.locator('button[aria-label="Save recipe"]').first();
    await heartBtn.click();

    // Heart should now show filled state
    await expect(authenticatedPage.locator('button[aria-label="Unsave recipe"]').first()).toBeVisible();
  });
});
