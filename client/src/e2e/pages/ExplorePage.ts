import { type Page, expect } from '@playwright/test';

/** Page object for the unified explore page (`/feed`). */
export class ExplorePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/feed');
  }

  /** Open the sort dropdown and switch to "Recent" so newly created recipes appear first. */
  async sortByRecent(): Promise<void> {
    await this.page.waitForLoadState('networkidle');

    // Open the sort dropdown
    const trigger = this.page.locator('[aria-haspopup="listbox"]');
    await trigger.click();

    await Promise.all([
      this.page.waitForResponse((resp) => resp.url().includes('/recipes/explore') && resp.url().includes('sort=recent')),
      this.page.getByRole('option').filter({ hasText: 'Recent' }).click(),
    ]);
  }

  async expectRecipeVisible(title: string): Promise<void> {
    await expect(this.page.getByText(title).first()).toBeVisible({ timeout: 10_000 });
  }

  async clickRecipe(title: string): Promise<void> {
    await this.page.getByText(title).first().click();
  }
}
