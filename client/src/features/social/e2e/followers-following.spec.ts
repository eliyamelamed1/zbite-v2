import { test, expect } from '../../../e2e/fixtures/auth.fixture';

import { registerUserViaApi, followUserViaApi } from '../../../e2e/helpers/api-client';
import { createUserData } from '../../../e2e/fixtures/test-data';
import { UserProfilePage } from '../../../e2e/pages/UserProfilePage';
import { FollowersPage } from '../../../e2e/pages/FollowersPage';
import { FollowingListPage } from '../../../e2e/pages/FollowingListPage';

test.describe('Followers & Following Pages', () => {
  test('clicking followers count shows followers list', async ({ authenticatedPage, userA }) => {
    const target = await registerUserViaApi(createUserData('followtarget'));
    await followUserViaApi(userA.token, target.id);
    const followers = new FollowersPage(authenticatedPage);

    await followers.goto(target.id);

    await followers.expectUserVisible(userA.username);
  });

  test('clicking following count shows following list', async ({ authenticatedPage, userA }) => {
    const target = await registerUserViaApi(createUserData('followee'));
    await followUserViaApi(userA.token, target.id);
    const following = new FollowingListPage(authenticatedPage);

    await following.goto(userA.id);

    await following.expectUserVisible(target.username);
  });

  test('clicking a user navigates to their profile', async ({ authenticatedPage, userA }) => {
    const target = await registerUserViaApi(createUserData('profilenav'));
    await followUserViaApi(userA.token, target.id);
    const following = new FollowingListPage(authenticatedPage);

    await following.goto(userA.id);
    await following.clickUser(target.username);

    await expect(authenticatedPage).toHaveURL(new RegExp(`/user/${target.id}`));
  });
});
