import { type Page, expect } from '@playwright/test';

/** Component object for the navigation bar (present on all authenticated pages). */
export class Navbar {
  constructor(private readonly page: Page) {}

  async search(query: string): Promise<void> {
    await this.page.getByPlaceholder('Search recipes & chefs...').fill(query);
  }

  async clickSearchResult(text: string): Promise<void> {
    const result = this.page.getByText(text).first();
    await expect(result).toBeVisible({ timeout: 5_000 });
    await result.click();
  }

  async openAvatarMenu(): Promise<void> {
    await this.page.locator('[class*="avatarBtn"]').click();
  }

  async logout(): Promise<void> {
    await this.openAvatarMenu();
    await this.page.getByRole('button', { name: 'Logout', exact: true }).click();
  }

  async clickCreateRecipe(): Promise<void> {
    await this.page.getByRole('button', { name: '+ Create' }).click();
    await this.page.waitForURL('**/recipe/new');
  }
}
