import { type Page, expect } from '@playwright/test';

/** Page object for the followers list page (`/user/:id/followers`). */
export class FollowersPage {
  constructor(private readonly page: Page) {}

  async goto(userId: string): Promise<void> {
    await this.page.goto(`/user/${userId}/followers`);
  }

  async expectUserVisible(username: string): Promise<void> {
    await expect(this.page.getByText(`@${username}`).first()).toBeVisible({ timeout: 10_000 });
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.page.getByText('No followers yet')).toBeVisible();
  }

  async clickUser(username: string): Promise<void> {
    await this.page.getByText(`@${username}`).first().click();
  }
}
