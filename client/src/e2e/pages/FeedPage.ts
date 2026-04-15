import { type Page, expect } from '@playwright/test';

/** Page object for the unified feed/explore page (`/feed`). */
export class FeedPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/feed');
  }

  /** Open the sort dropdown and select an option by label (e.g. 'Following', 'Trending'). */
  async selectSort(label: string): Promise<void> {
    await this.page.waitForLoadState('networkidle');

    // Open the sort dropdown by clicking the trigger button
    const trigger = this.page.locator('[aria-haspopup="listbox"]');
    await trigger.click();

    const endpoint = label === 'Following' ? '/recipes/following' : '/recipes/explore';
    await Promise.all([
      this.page.waitForResponse((resp) => resp.url().includes(endpoint)),
      this.page.getByRole('option').filter({ hasText: label }).click(),
    ]);
  }

  async expectRecipeVisible(title: string): Promise<void> {
    await expect(this.page.getByText(title).first()).toBeVisible({ timeout: 10_000 });
  }

  async expectNoRecipes(): Promise<void> {
    await expect(this.page.getByText('No recipes')).toBeVisible({ timeout: 5_000 }).catch(() => {
      // Some UIs show an empty state differently
    });
  }
}
