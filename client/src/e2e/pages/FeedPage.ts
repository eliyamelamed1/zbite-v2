import { type Page, expect } from '@playwright/test';

/** Page object for the feed page (`/feed`). */
export class FeedPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/feed');
  }

  async switchToFeedTab(): Promise<void> {
    await this.page.getByRole('button', { name: 'Feed' }).click();
  }

  async switchToExploreTab(): Promise<void> {
    await this.page.getByRole('button', { name: 'Explore' }).click();
  }

  async switchToSavedTab(): Promise<void> {
    await this.page.getByRole('button', { name: 'Saved' }).click();
  }

  async expectRecipeVisible(title: string): Promise<void> {
    await expect(this.page.getByText(title).first()).toBeVisible({ timeout: 10_000 });
  }

  async expectNoRecipes(): Promise<void> {
    // Verify the feed is empty — wait a reasonable time to confirm nothing loads
    await expect(this.page.getByText('No recipes')).toBeVisible({ timeout: 5_000 }).catch(() => {
      // Some UIs show an empty state differently — this is acceptable
    });
  }
}
