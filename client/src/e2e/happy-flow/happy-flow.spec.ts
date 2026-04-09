/**
 * Smoke test — full user journey from signup to notifications.
 * Uses page objects for readability. Runs as a single atomic test
 * alongside all feature tests concurrently.
 */
import { test, expect } from '@playwright/test';

import { createUserData, DEFAULT_INTERESTS, ALTERNATE_INTERESTS, TEST_IMAGE_PATH } from '../fixtures/test-data';
import { LandingPage } from '../pages/LandingPage';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../pages/LoginPage';
import { RecipeWizardPage } from '../pages/RecipeWizardPage';
import { RecipeDetailPage } from '../pages/RecipeDetailPage';
import { ExplorePage } from '../pages/ExplorePage';
import { FeedPage } from '../pages/FeedPage';
import { ActivityPage } from '../pages/ActivityPage';
import { Navbar } from '../pages/components/Navbar';
import { ActionBar } from '../pages/components/ActionBar';

test('complete user journey — signup, create, interact, follow, notifications', async ({ page }) => {
  test.setTimeout(120_000);

  const userA = createUserData('hfa');
  const userB = createUserData('hfb');

  const landing = new LandingPage(page);
  const registerPage = new RegisterPage(page);
  const loginPage = new LoginPage(page);
  const wizard = new RecipeWizardPage(page);
  const detail = new RecipeDetailPage(page);
  const explore = new ExplorePage(page);
  const feed = new FeedPage(page);
  const activity = new ActivityPage(page);
  const navbar = new Navbar(page);
  const actionBar = new ActionBar(page);

  // 1. Landing page
  await landing.goto();
  await landing.expectTitleVisible();

  // 2. Sign up as User A
  await registerPage.signUp(userA, DEFAULT_INTERESTS);

  // 3. Create a recipe
  await navbar.clickCreateRecipe();
  await wizard.uploadCoverImage(TEST_IMAGE_PATH);
  await wizard.fillBasics({
    title: 'Pasta Carbonara',
    description: 'A classic Italian pasta dish.',
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

  // 4. Publish and view
  await wizard.publish();
  await wizard.viewPublishedRecipe();

  // 5. Verify recipe detail
  await detail.expectTitleVisible('Pasta Carbonara');
  await detail.expectIngredientVisible('Spaghetti');
  await detail.expectCaloriesVisible(450);

  // 6. Check explore — recipe appears (sort by recent so new recipe is visible)
  await explore.goto();
  await explore.sortByRecent();
  await explore.expectRecipeVisible('Pasta Carbonara');

  // 7. Logout User A
  await navbar.logout();

  // 8. Sign up as User B
  await registerPage.signUp(userB, ALTERNATE_INTERESTS);

  // 9. Find recipe on explore
  await explore.goto();
  await explore.sortByRecent();
  await explore.expectRecipeVisible('Pasta Carbonara');
  await explore.clickRecipe('Pasta Carbonara');

  // 10. Interact — like, rate, comment
  await detail.expectTitleVisible('Pasta Carbonara');
  await actionBar.like();
  await actionBar.rate(5);
  await actionBar.comment('Amazing recipe!');
  await actionBar.expectCommentVisible('Amazing recipe!');

  // 11. Follow User A via search
  await navbar.search(userA.username);
  await navbar.clickSearchResult(`@${userA.username}`);
  await expect(page.getByText(`@${userA.username}`).first()).toBeVisible();
  const followButton = page.getByRole('button', { name: 'Follow' });
  if (await followButton.isVisible()) {
    await followButton.click();
  }

  // 12. Check following feed
  await feed.goto();
  // Feed tab (default) shows recipes from followed users
  await feed.expectRecipeVisible('Pasta Carbonara');

  // 13. Logout User B → Login as User A
  await navbar.logout();
  await loginPage.login(userA.email, userA.password);

  // 14. Check notifications — should see User B's activity
  await activity.goto();
  await activity.expectNotificationFromUser(userB.username);
});
