import { test, expect } from '../../../e2e/fixtures/auth.fixture';

import { TEST_IMAGE_PATH } from '../../../e2e/fixtures/test-data';
import { RecipeWizardPage } from '../../../e2e/pages/RecipeWizardPage';
import { RecipeDetailPage } from '../../../e2e/pages/RecipeDetailPage';
import { ExplorePage } from '../../../e2e/pages/ExplorePage';
import { UserProfilePage } from '../../../e2e/pages/UserProfilePage';
import { Navbar } from '../../../e2e/pages/components/Navbar';

test.describe('Recipe CRUD', () => {
  test('create recipe via wizard', async ({ authenticatedPage }) => {
    const navbar = new Navbar(authenticatedPage);
    const wizard = new RecipeWizardPage(authenticatedPage);

    await navbar.clickCreateRecipe();
    await wizard.uploadCoverImage(TEST_IMAGE_PATH);
    await wizard.fillBasics({
      title: 'Wizard Test Recipe',
      description: 'A recipe created through the full wizard flow.',
      difficulty: 'medium',
      cookingTime: 30,
      category: 'Italian',
    });
    await wizard.addIngredient('400g', 'Spaghetti', 0);
    await wizard.clickAddIngredient();
    await wizard.addIngredient('200g', 'Guanciale', 1);
    await wizard.submitIngredients();
    await wizard.addStep('Boil pasta', 'Boil water and cook pasta until al dente.');
    await wizard.fillNutrition({ calories: 450, protein: 25, carbs: 50, fat: 18 });
    await wizard.publish();
    await wizard.viewPublishedRecipe();

    const detail = new RecipeDetailPage(authenticatedPage);
    await detail.expectTitleVisible('Wizard Test Recipe');
    await detail.expectIngredientVisible('Spaghetti');
    await detail.expectCaloriesVisible(450);
  });

  test('view recipe detail shows all fields', async ({ authenticatedPage, recipeByUserA, recipeData }) => {
    const detail = new RecipeDetailPage(authenticatedPage);

    await detail.goto(recipeByUserA.id);

    await detail.expectTitleVisible(recipeData.title);
    await detail.expectIngredientVisible('Spaghetti');
    await detail.expectCaloriesVisible(recipeData.nutrition.calories);
  });

  test('recipe appears on explore page', async ({ authenticatedPage, recipeByUserA, recipeData }) => {
    const explore = new ExplorePage(authenticatedPage);

    await explore.goto();
    await explore.sortByRecent();

    await explore.expectRecipeVisible(recipeData.title);
  });

  test('recipe appears on user profile', async ({ authenticatedPage, userA, recipeByUserA, recipeData }) => {
    const profile = new UserProfilePage(authenticatedPage);

    await profile.goto(userA.id);

    await profile.expectRecipeVisible(recipeData.title);
  });
});
