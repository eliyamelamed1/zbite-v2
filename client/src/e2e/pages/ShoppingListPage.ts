import { type Page, expect } from '@playwright/test';

/** Page object for the shopping list page (`/shopping-list`). */
export class ShoppingListPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/shopping-list');
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.page.getByText('Your shopping list is empty')).toBeVisible();
  }

  async expectItemVisible(name: string): Promise<void> {
    await expect(this.page.getByText(name).first()).toBeVisible();
  }

  async expectItemNotVisible(name: string): Promise<void> {
    await expect(this.page.getByText(name)).not.toBeVisible();
  }

  async toggleItem(name: string): Promise<void> {
    const item = this.page.locator(`text=${name}`).first().locator('..');
    await item.locator('button').first().click();
  }

  async expectBoughtSection(): Promise<void> {
    await expect(this.page.getByText(/Bought/)).toBeVisible();
  }

  async clearAll(): Promise<void> {
    await this.page.getByText('Clear all').click();
  }
}
