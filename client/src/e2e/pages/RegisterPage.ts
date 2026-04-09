import { type Page, expect } from '@playwright/test';

interface SignUpData {
  username: string;
  email: string;
  password: string;
}

/**
 * Page object for the multi-step registration wizard (`/register`).
 * Steps: Username → Email → Password → Interests → Finish.
 */
export class RegisterPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/register');
  }

  async fillUsername(username: string): Promise<void> {
    await expect(this.page.getByText('What should we call you?')).toBeVisible();
    await this.page.getByPlaceholder('e.g. chefmario').fill(username);
    await this.page.getByRole('button', { name: 'Next' }).click();
  }

  async fillEmail(email: string): Promise<void> {
    await expect(this.page.getByText('Your email')).toBeVisible();
    await this.page.getByPlaceholder('chef@example.com').fill(email);
    await this.page.getByRole('button', { name: 'Next' }).click();
  }

  async fillPassword(password: string): Promise<void> {
    await expect(this.page.getByText('Create a password')).toBeVisible();
    await this.page.getByPlaceholder('••••••••').fill(password);
    await this.page.getByRole('button', { name: 'Next' }).click();
  }

  async selectInterests(interests: readonly string[]): Promise<void> {
    await expect(this.page.getByText('What do you love to eat?')).toBeVisible();
    for (const interest of interests) {
      await this.page.getByTestId(`category-${interest}`).click();
    }
    await expect(this.page.getByText('✓').first()).toBeVisible();
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: 'Finish' }).click();

    // Wait for redirect to /feed — handle edge case where URL stays on /register
    await this.page.waitForURL('**/feed', { timeout: 10_000 }).catch(async () => {
      if (this.page.url().includes('/register')) {
        await this.page.goto('/feed');
      }
    });
    await this.page.waitForURL('**/feed', { timeout: 10_000 });
  }

  /** Full signup flow — orchestrates all steps. */
  async signUp(user: SignUpData, interests: readonly string[]): Promise<void> {
    await this.goto();
    await this.fillUsername(user.username);
    await this.fillEmail(user.email);
    await this.fillPassword(user.password);
    await this.selectInterests(interests);
    await this.submit();
  }
}
