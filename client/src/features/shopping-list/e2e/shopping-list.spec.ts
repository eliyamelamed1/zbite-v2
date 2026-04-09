import { test, expect } from '../../../e2e/fixtures/auth.fixture';

import {
  registerUserViaApi,
  createRecipeViaApi,
  addRecipeToShoppingListViaApi,
} from '../../../e2e/helpers/api-client';
import { createUserData, createRecipeData } from '../../../e2e/fixtures/test-data';
import { ShoppingListPage } from '../../../e2e/pages/ShoppingListPage';

test.describe('Shopping List', () => {
  test('shopping list page shows empty state initially', async ({ authenticatedPage }) => {
    const shoppingList = new ShoppingListPage(authenticatedPage);

    await shoppingList.goto();

    await shoppingList.expectEmptyState();
  });

  test('adding recipe to shopping list shows ingredients', async ({ authenticatedPage, userA }) => {
    const chef = await registerUserViaApi(createUserData('shopchef'));
    const recipeData = createRecipeData('ShopRecipe');
    const recipe = await createRecipeViaApi(chef.token, recipeData);
    await addRecipeToShoppingListViaApi(userA.token, recipe.id);
    const shoppingList = new ShoppingListPage(authenticatedPage);

    await shoppingList.goto();

    await shoppingList.expectItemVisible('Spaghetti');
    await shoppingList.expectItemVisible('Guanciale');
  });

  test('checking off an item shows bought section', async ({ authenticatedPage, userA }) => {
    const chef = await registerUserViaApi(createUserData('checkchef'));
    const recipe = await createRecipeViaApi(chef.token, createRecipeData('CheckRecipe'));
    await addRecipeToShoppingListViaApi(userA.token, recipe.id);
    const shoppingList = new ShoppingListPage(authenticatedPage);

    await shoppingList.goto();
    await shoppingList.expectItemVisible('Spaghetti');

    // Click the checkbox on the first item using aria-label
    await authenticatedPage.getByRole('button', { name: 'Mark as bought' }).first().click();

    // Wait for the bought section to appear (optimistic update + API response)
    await shoppingList.expectBoughtSection();
  });

  test('clear all removes all items', async ({ authenticatedPage, userA }) => {
    const chef = await registerUserViaApi(createUserData('clearchef'));
    const recipe = await createRecipeViaApi(chef.token, createRecipeData('ClearRecipe'));
    await addRecipeToShoppingListViaApi(userA.token, recipe.id);
    const shoppingList = new ShoppingListPage(authenticatedPage);

    await shoppingList.goto();
    await shoppingList.expectItemVisible('Spaghetti');

    await shoppingList.clearAll();

    // After optimistic clear, check empty state or wait for confirmation
    await expect(authenticatedPage.getByText('Spaghetti')).not.toBeVisible({ timeout: 5_000 });
  });
});
