import { type Page, expect } from '@playwright/test';

interface RecipeBasics {
  title: string;
  description: string;
  difficulty: string;
  cookingTime: number;
  tags: string[];
}

interface RecipeNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Page object for the 4-step recipe creation wizard (`/recipe/new`).
 * Steps: Cover Image → Basics → Ingredients → Steps & Nutrition → Publish.
 */
export class RecipeWizardPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/recipe/new');
  }

  /** Step 1: Upload a cover image. */
  async uploadCoverImage(filePath: string): Promise<void> {
    await expect(this.page.getByText('Start with a photo')).toBeVisible();
    await this.page.locator('input[type="file"]').setInputFiles(filePath);
    await expect(this.page.locator('img[alt="Preview"]')).toBeVisible();
    await this.page.getByRole('button', { name: 'Next' }).click();
  }

  /** Step 2: Fill in title, description, difficulty, cooking time, tags. */
  async fillBasics(basics: RecipeBasics): Promise<void> {
    await expect(this.page.getByText('The Basics')).toBeVisible();
    await this.page.getByPlaceholder("e.g. Grandma's Sourdough").fill(basics.title);
    await this.page.getByPlaceholder('Share the story behind').fill(basics.description);
    await this.page.getByRole('button', { name: new RegExp(basics.difficulty, 'i') }).click();
    await this.page.getByPlaceholder('Min').fill(String(basics.cookingTime));
    for (const tag of basics.tags) {
      await this.page.locator('button').filter({ hasText: tag }).click();
    }
    await this.page.getByRole('button', { name: 'Next' }).click();
  }

  /** Step 3: Add a single ingredient row. Call multiple times for multiple ingredients. */
  async addIngredient(amount: string, name: string, index = 0): Promise<void> {
    await this.page.getByPlaceholder('Amount').nth(index).fill(amount);
    await this.page.getByPlaceholder('Ingredient').nth(index).fill(name);
  }

  /** Click "+ Add Ingredient" to add a new empty row. */
  async clickAddIngredient(): Promise<void> {
    await this.page.getByRole('button', { name: '+ Add Ingredient' }).click();
  }

  /** Advance from ingredients step to steps step. */
  async submitIngredients(): Promise<void> {
    await this.page.getByRole('button', { name: 'Next' }).click();
  }

  /** Step 4: Add a recipe step. */
  async addStep(title: string, description: string, index = 0): Promise<void> {
    await expect(this.page.getByText('Recipe Steps')).toBeVisible();
    await this.page.getByPlaceholder('Step title').nth(index).fill(title);
    await this.page.getByPlaceholder('Describe the cooking process').nth(index).fill(description);
  }

  /** Step 4: Fill nutrition fields. */
  async fillNutrition(nutrition: RecipeNutrition): Promise<void> {
    await this.page.getByPlaceholder('Calories').fill(String(nutrition.calories));
    await this.page.getByPlaceholder('Protein (g)').fill(String(nutrition.protein));
    await this.page.getByPlaceholder('Carbs (g)').fill(String(nutrition.carbs));
    await this.page.getByPlaceholder('Fat (g)').fill(String(nutrition.fat));
  }

  /** Click the publish button on the final step. */
  async publish(): Promise<void> {
    await this.page.getByRole('button', { name: /Next Step|Publishing/i }).click();
    await expect(this.page.getByText('Recipe Published!')).toBeVisible({ timeout: 15_000 });
  }

  /** After publishing, click "View Recipe" to navigate to the detail page. */
  async viewPublishedRecipe(): Promise<void> {
    await this.page.getByRole('button', { name: /View Recipe/i }).click();
  }
}
