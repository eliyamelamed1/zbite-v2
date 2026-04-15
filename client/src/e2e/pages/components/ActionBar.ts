import { type Page, expect } from '@playwright/test';

/** Component object for the recipe action bar (comment, share, save). */
export class ActionBar {
  constructor(private readonly page: Page) {}

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
