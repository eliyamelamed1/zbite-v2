import { type Page, expect } from '@playwright/test';

/** Component object for the recipe action bar (like, rate, comment, save). */
export class ActionBar {
  constructor(private readonly page: Page) {}

  /** Click the like/heart button (first button in the action bar). */
  async like(): Promise<void> {
    const actionButtons = this.page.locator('[class*="bar"] > button');
    await actionButtons.first().click();
  }

  /** Rate a recipe by clicking the nth star (1-based). */
  async rate(stars: number): Promise<void> {
    const starButtons = this.page
      .locator('[class*="wrapper"] button, [class*="star"]')
      .filter({ hasText: '★' });
    await expect(starButtons.nth(stars - 1)).toBeVisible();
    await starButtons.nth(stars - 1).click();
  }

  /** Post a comment on the recipe. */
  async comment(text: string): Promise<void> {
    const commentInput = this.page.getByPlaceholder('Write a comment...');
    await expect(commentInput).toBeVisible();
    await commentInput.fill(text);
    await this.page.getByRole('button', { name: 'Post' }).click();
  }

  async expectCommentVisible(text: string): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }
}
