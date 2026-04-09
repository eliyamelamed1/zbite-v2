import { type Page, expect } from '@playwright/test';

/** Page object for the explore/discover page (`/feed?tab=explore`). */
export class ExplorePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/feed?tab=explore');
  }

  /** Switch to "Recent" sort so newly created recipes appear first. */
  async sortByRecent(): Promise<void> {
    // Wait for any initial fetch to settle before changing sort
    await this.page.waitForLoadState('networkidle');
    await Promise.all([
      this.page.waitForResponse((resp) => resp.url().includes('/recipes/explore') && resp.url().includes('sort=recent')),
      this.page.getByRole('button', { name: 'Recent' }).click(),
    ]);
  }

  async expectRecipeVisible(title: string): Promise<void> {
    await expect(this.page.getByText(title).first()).toBeVisible({ timeout: 10_000 });
  }

  async clickRecipe(title: string): Promise<void> {
    await this.page.getByText(title).first().click();
  }
}
