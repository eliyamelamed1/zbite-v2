import { type Page, expect } from '@playwright/test';

/** Page object for the landing page (`/`). */
export class LandingPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async expectTitleVisible(): Promise<void> {
    await expect(this.page.locator('[class*="desktopTitle"]')).toBeVisible();
  }

  async clickGetStarted(): Promise<void> {
    await this.page.getByRole('button', { name: /get started/i }).click();
  }

  async clickLogin(): Promise<void> {
    await this.page.getByRole('link', { name: /log in/i }).click();
  }
}
