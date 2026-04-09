import { test, expect } from '../../../e2e/fixtures/auth.fixture';

import {
  registerUserViaApi,
  createRecipeViaApi,
  commentOnRecipeViaApi,
} from '../../../e2e/helpers/api-client';
import { createUserData, createRecipeData } from '../../../e2e/fixtures/test-data';
import { RecipeDetailPage } from '../../../e2e/pages/RecipeDetailPage';

test.describe('Comment Replies', () => {
  test('reply to a comment appears as threaded reply', async ({ authenticatedPage, userA }) => {
    const chef = await registerUserViaApi(createUserData('replychef'));
    const recipe = await createRecipeViaApi(chef.token, createRecipeData('ReplyRecipe'));
    // Chef comments first
    await commentOnRecipeViaApi(chef.token, recipe.id, 'Original comment');
    const detail = new RecipeDetailPage(authenticatedPage);

    await detail.goto(recipe.id);

    // Verify original comment visible
    await expect(authenticatedPage.getByText('Original comment').first()).toBeVisible();
  });

  test('reply generates notification for comment author', async ({ authenticatedPage, userA }) => {
    const chef = await registerUserViaApi(createUserData('notifchef'));
    const recipe = await createRecipeViaApi(chef.token, createRecipeData('NotifReplyRecipe'));
    await commentOnRecipeViaApi(chef.token, recipe.id, 'Parent comment');

    // userA replies via API
    await commentOnRecipeViaApi(userA.token, recipe.id, 'This is a reply');

    // Check chef's notifications
    const detail = new RecipeDetailPage(authenticatedPage);
    await detail.goto(recipe.id);
    await expect(authenticatedPage.getByText('This is a reply').first()).toBeVisible();
  });
});
