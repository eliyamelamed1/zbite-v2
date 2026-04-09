import { test, expect } from '../../../e2e/fixtures/auth.fixture';

import { registerUserViaApi, createRecipeViaApi } from '../../../e2e/helpers/api-client';
import { createUserData, createRecipeData } from '../../../e2e/fixtures/test-data';
import { UserProfilePage } from '../../../e2e/pages/UserProfilePage';
import { Navbar } from '../../../e2e/pages/components/Navbar';

test.describe('Profile', () => {
  test('view user profile shows username', async ({ authenticatedPage }) => {
    const targetUser = await registerUserViaApi(createUserData('profileview'));
    const profile = new UserProfilePage(authenticatedPage);

    await profile.goto(targetUser.id);

    await profile.expectUsernameVisible(targetUser.username);
  });

  test('search finds a user via navbar', async ({ authenticatedPage }) => {
    const targetUser = await registerUserViaApi(createUserData('searchuser'));
    const navbar = new Navbar(authenticatedPage);
    const profile = new UserProfilePage(authenticatedPage);

    await navbar.search(targetUser.username);
    await navbar.clickSearchResult(`@${targetUser.username}`);

    await profile.expectUsernameVisible(targetUser.username);
  });

  test('profile shows user recipes', async ({ authenticatedPage }) => {
    const chef = await registerUserViaApi(createUserData('recipechef'));
    const recipeData = createRecipeData('ProfileRecipe');
    await createRecipeViaApi(chef.token, recipeData);
    const profile = new UserProfilePage(authenticatedPage);

    await profile.goto(chef.id);

    await profile.expectRecipeVisible(recipeData.title);
  });
});
