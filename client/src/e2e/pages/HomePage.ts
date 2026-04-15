import { type Page, expect } from '@playwright/test';

/** Page object for the home page (`/`). */
export class HomePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async expectTitleVisible(): Promise<void> {
    await expect(this.page.getByText('What should I cook?')).toBeVisible();
  }

  async clickHelpMeChoose(): Promise<void> {
    await this.page.getByRole('button', { name: /help me choose/i }).click();
  }

  async clickSurpriseMe(): Promise<void> {
    await this.page.getByRole('button', { name: /surprise me/i }).click();
  }
}
