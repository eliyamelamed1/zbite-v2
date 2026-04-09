import { test, expect } from '../../../e2e/fixtures/auth.fixture';

import { LeaderboardPage } from '../../../e2e/pages/LeaderboardPage';

test.describe('Leaderboard', () => {
  test('leaderboard page renders', async ({ authenticatedPage }) => {
    const leaderboard = new LeaderboardPage(authenticatedPage);

    await leaderboard.goto();

    await leaderboard.expectHeadingVisible();
  });

  test('leaderboard shows users', async ({ authenticatedPage }) => {
    const leaderboard = new LeaderboardPage(authenticatedPage);

    await leaderboard.goto();

    // Verify the page has content — at least one user entry should be visible
    await expect(authenticatedPage.locator('text=/\\d+/').first()).toBeVisible({ timeout: 10_000 });
  });
});
