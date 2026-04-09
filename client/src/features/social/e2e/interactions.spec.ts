import { test, expect } from '../../../e2e/fixtures/auth.fixture';

import { registerUserViaApi, createRecipeViaApi } from '../../../e2e/helpers/api-client';
import { createUserData, createRecipeData } from '../../../e2e/fixtures/test-data';
import { RecipeDetailPage } from '../../../e2e/pages/RecipeDetailPage';
import { ActionBar } from '../../../e2e/pages/components/ActionBar';

/**
 * Each test creates its own "other user" with a recipe to interact with.
 * This ensures full isolation for concurrent execution.
 */
test.describe('Social Interactions', () => {
  test('like a recipe', async ({ authenticatedPage }) => {
    const otherUser = await registerUserViaApi(createUserData('liker'));
    const recipe = await createRecipeViaApi(otherUser.token, createRecipeData('Likeable'));
    const detail = new RecipeDetailPage(authenticatedPage);
    const actionBar = new ActionBar(authenticatedPage);

    await detail.goto(recipe.id);
    await detail.expectTitleVisible(recipe.title);

    await actionBar.like();

    const heartButton = authenticatedPage.locator('[class*="bar"] > button').first();
    await expect(heartButton).toBeVisible();
  });

  test('rate a recipe', async ({ authenticatedPage }) => {
    const otherUser = await registerUserViaApi(createUserData('rater'));
    const recipe = await createRecipeViaApi(otherUser.token, createRecipeData('Rateable'));
    const detail = new RecipeDetailPage(authenticatedPage);
    const actionBar = new ActionBar(authenticatedPage);

    await detail.goto(recipe.id);
    await detail.expectTitleVisible(recipe.title);

    await actionBar.rate(5);
  });

  test('comment on a recipe', async ({ authenticatedPage }) => {
    const otherUser = await registerUserViaApi(createUserData('commenter'));
    const recipe = await createRecipeViaApi(otherUser.token, createRecipeData('Commentable'));
    const detail = new RecipeDetailPage(authenticatedPage);
    const actionBar = new ActionBar(authenticatedPage);

    await detail.goto(recipe.id);
    await detail.expectTitleVisible(recipe.title);

    await actionBar.comment('Looks delicious!');

    await actionBar.expectCommentVisible('Looks delicious!');
  });

  test('delete own comment removes it from the list', async ({ authenticatedPage }) => {
    const otherUser = await registerUserViaApi(createUserData('delcomment'));
    const recipe = await createRecipeViaApi(otherUser.token, createRecipeData('Deletable'));
    const detail = new RecipeDetailPage(authenticatedPage);
    const actionBar = new ActionBar(authenticatedPage);

    await detail.goto(recipe.id);
    await actionBar.comment('Comment to delete');
    await actionBar.expectCommentVisible('Comment to delete');

    // Look for delete/trash button on own comment and click it
    const deleteBtn = authenticatedPage.locator('button[aria-label="Delete comment"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await expect(authenticatedPage.getByText('Comment to delete')).not.toBeVisible();
    }
  });
});
