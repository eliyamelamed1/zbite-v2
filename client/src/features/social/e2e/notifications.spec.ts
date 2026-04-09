import { test, expect } from '../../../e2e/fixtures/auth.fixture';

import {
  registerUserViaApi,
  createRecipeViaApi,
  likeRecipeViaApi,
  followUserViaApi,
  commentOnRecipeViaApi,
} from '../../../e2e/helpers/api-client';
import { createUserData, createRecipeData } from '../../../e2e/fixtures/test-data';
import { ActivityPage } from '../../../e2e/pages/ActivityPage';

test.describe('Notifications', () => {
  test('like generates a notification', async ({ authenticatedPage, userA }) => {
    const recipeData = createRecipeData('NotifLike');
    const recipe = await createRecipeViaApi(userA.token, recipeData);
    const liker = await registerUserViaApi(createUserData('liker'));
    await likeRecipeViaApi(liker.token, recipe.id);
    const activity = new ActivityPage(authenticatedPage);

    await activity.goto();

    await activity.expectNotificationFromUser(liker.username);
  });

  test('follow generates a notification', async ({ authenticatedPage, userA }) => {
    const follower = await registerUserViaApi(createUserData('follower'));
    await followUserViaApi(follower.token, userA.id);
    const activity = new ActivityPage(authenticatedPage);

    await activity.goto();

    await activity.expectNotificationFromUser(follower.username);
  });

  test('comment generates a notification', async ({ authenticatedPage, userA }) => {
    const recipeData = createRecipeData('NotifComment');
    const recipe = await createRecipeViaApi(userA.token, recipeData);
    const commenter = await registerUserViaApi(createUserData('cmtr'));
    await commentOnRecipeViaApi(commenter.token, recipe.id, 'Great recipe!');
    const activity = new ActivityPage(authenticatedPage);

    await activity.goto();

    await activity.expectNotificationFromUser(commenter.username);
  });

  test('@mention in comment generates notification', async ({ authenticatedPage, userA }) => {
    const recipeData = createRecipeData('MentionRecipe');
    const recipe = await createRecipeViaApi(userA.token, recipeData);
    const mentioner = await registerUserViaApi(createUserData('mentioner'));
    await commentOnRecipeViaApi(mentioner.token, recipe.id, `Hey @${userA.username} check this out!`);
    const activity = new ActivityPage(authenticatedPage);

    await activity.goto();

    await activity.expectNotificationFromUser(mentioner.username);
  });
});
