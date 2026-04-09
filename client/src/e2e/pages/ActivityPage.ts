import { type Page, expect } from '@playwright/test';

/** Page object for the notifications/activity page (`/activity`). */
export class ActivityPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/activity');
  }

  async expectNotificationFromUser(username: string): Promise<void> {
    await expect(this.page.getByText(`@${username}`).first()).toBeVisible({ timeout: 10_000 });
  }

  async expectNotificationVisible(text: string): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible({ timeout: 10_000 });
  }
}
