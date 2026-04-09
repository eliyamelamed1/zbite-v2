import { type Page, expect } from '@playwright/test';

/** Page object for the following list page (`/user/:id/following`). */
export class FollowingListPage {
  constructor(private readonly page: Page) {}

  async goto(userId: string): Promise<void> {
    await this.page.goto(`/user/${userId}/following`);
  }

  async expectUserVisible(username: string): Promise<void> {
    await expect(this.page.getByText(`@${username}`).first()).toBeVisible({ timeout: 10_000 });
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.page.getByText('Not following anyone yet')).toBeVisible();
  }

  async clickUser(username: string): Promise<void> {
    await this.page.getByText(`@${username}`).first().click();
  }
}
