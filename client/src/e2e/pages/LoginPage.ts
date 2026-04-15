import { type Page, expect } from '@playwright/test';

/** Page object for the login page (`/login`). */
export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async fillEmail(email: string): Promise<void> {
    await this.page.locator('input[type="email"]').fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.page.locator('input[type="password"]').fill(password);
  }

  async submitForm(): Promise<void> {
    await this.page.locator('form').getByRole('button', { name: /Log In/i }).click();
  }

  /** Full login flow — fill credentials and submit. */
  async login(email: string, password: string): Promise<void> {
    await this.goto();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submitForm();
    await this.page.waitForURL('**/feed', { timeout: 10_000 });
  }

  async expectErrorVisible(message: string): Promise<void> {
    await expect(this.page.getByText(message)).toBeVisible();
  }
}
