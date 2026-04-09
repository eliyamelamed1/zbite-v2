import { type Page, expect } from '@playwright/test';

/** Page object for the recipe detail page (`/recipe/:id`). */
export class RecipeDetailPage {
  constructor(private readonly page: Page) {}

  async goto(recipeId: string): Promise<void> {
    await this.page.goto(`/recipe/${recipeId}`);
  }

  async expectTitleVisible(title: string): Promise<void> {
    await expect(this.page.getByText(title).first()).toBeVisible();
  }

  async expectIngredientVisible(ingredientName: string): Promise<void> {
    await expect(this.page.getByText(ingredientName)).toBeVisible();
  }

  async expectCaloriesVisible(calories: number): Promise<void> {
    await expect(this.page.getByText(String(calories))).toBeVisible();
  }

  /** Return the current page URL (useful for saving recipe URLs for later navigation). */
  getCurrentUrl(): string {
    return this.page.url();
  }
}
