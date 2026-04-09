import { test, expect } from '../../../e2e/fixtures/auth.fixture';

import { registerUserViaApi, createRecipeViaApi, followUserViaApi } from '../../../e2e/helpers/api-client';
import { createUserData, createRecipeData } from '../../../e2e/fixtures/test-data';
import { UserProfilePage } from '../../../e2e/pages/UserProfilePage';
import { FeedPage } from '../../../e2e/pages/FeedPage';
import { Navbar } from '../../../e2e/pages/components/Navbar';

test.describe('Follow', () => {
  test('follow a user via profile', async ({ authenticatedPage }) => {
    const targetUser = await registerUserViaApi(createUserData('target'));
    const profile = new UserProfilePage(authenticatedPage);

    await profile.goto(targetUser.id);

    await profile.expectUsernameVisible(targetUser.username);
    await profile.clickFollow();
    await profile.expectFollowingState();
  });

  test('following feed shows followed user recipes', async ({ authenticatedPage, userA }) => {
    const targetUser = await registerUserViaApi(createUserData('followed'));
    const recipeData = createRecipeData('FollowedRecipe');
    await createRecipeViaApi(targetUser.token, recipeData);
    await followUserViaApi(userA.token, targetUser.id);
    const feed = new FeedPage(authenticatedPage);

    await feed.goto();
    // Feed tab (default) shows recipes from followed users
    await feed.expectRecipeVisible(recipeData.title);
  });

  test('find and follow a user via search', async ({ authenticatedPage }) => {
    const targetUser = await registerUserViaApi(createUserData('searchable'));
    await createRecipeViaApi(targetUser.token, createRecipeData('SearchRecipe'));
    const navbar = new Navbar(authenticatedPage);
    const profile = new UserProfilePage(authenticatedPage);

    await navbar.search(targetUser.username);
    await navbar.clickSearchResult(`@${targetUser.username}`);

    await profile.expectUsernameVisible(targetUser.username);
    await profile.clickFollow();
    await profile.expectFollowingState();
  });
});
