import { type Page, expect } from '@playwright/test';

/** Page object for the leaderboard page (`/leaderboard`). */
export class LeaderboardPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/leaderboard');
  }

  async expectHeadingVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /top chefs/i })).toBeVisible();
  }

  async expectUserVisible(username: string): Promise<void> {
    await expect(this.page.getByText(username).first()).toBeVisible({ timeout: 10_000 });
  }
}
