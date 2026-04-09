import { type Page, expect } from '@playwright/test';

/** Page object for a user's profile page (`/user/:id`). */
export class UserProfilePage {
  constructor(private readonly page: Page) {}

  async goto(userId: string): Promise<void> {
    await this.page.goto(`/user/${userId}`);
  }

  async expectUsernameVisible(username: string): Promise<void> {
    await expect(this.page.getByText(`@${username}`).first()).toBeVisible();
  }

  async clickFollow(): Promise<void> {
    await this.page.getByRole('button', { name: 'Follow' }).click();
    await expect(this.page.getByRole('button', { name: 'Following' })).toBeVisible();
  }

  async expectFollowingState(): Promise<void> {
    await expect(this.page.getByRole('button', { name: 'Following' })).toBeVisible();
  }

  async clickUnfollow(): Promise<void> {
    await this.page.getByRole('button', { name: 'Following' }).click();
  }

  async expectRecipeVisible(title: string): Promise<void> {
    await expect(this.page.getByRole('img', { name: title })).toBeVisible({ timeout: 10_000 });
  }
}
