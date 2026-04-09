/**
 * Custom Playwright fixtures for authenticated test sessions.
 * Most tests import `test` from this file instead of `@playwright/test`
 * to get pre-authenticated pages without going through the signup UI.
 */
import { test as base, type Page } from '@playwright/test';

import { registerUserViaApi, createRecipeViaApi } from '../helpers/api-client';
import { createUserData, createRecipeData } from './test-data';

import type { TestUserData, TestRecipeData } from './test-data';

interface TestUserWithToken extends TestUserData {
  id: string;
  token: string;
}

interface CreatedRecipe {
  id: string;
  title: string;
}

interface AuthFixtures {
  /** A pre-registered user (via API). */
  userA: TestUserWithToken;
  /** A second pre-registered user (via API). */
  userB: TestUserWithToken;
  /** A page with userA already authenticated (token in localStorage). */
  authenticatedPage: Page;
  /** A recipe created by userA via API. */
  recipeByUserA: CreatedRecipe;
  /** Raw recipe data used to create recipeByUserA (for assertions). */
  recipeData: TestRecipeData;
}

export const test = base.extend<AuthFixtures>({
  userA: async ({}, use) => {
    const credentials = createUserData('usera');
    const user = await registerUserViaApi(credentials);
    await use(user);
  },

  userB: async ({}, use) => {
    const credentials = createUserData('userb');
    const user = await registerUserViaApi(credentials);
    await use(user);
  },

  authenticatedPage: async ({ page, userA }, use) => {
    // Inject the JWT token into localStorage before navigating
    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, userA.token);
    await page.goto('/feed');
    await use(page);
  },

  recipeData: async ({}, use) => {
    const data = createRecipeData('TestRecipe');
    await use(data);
  },

  recipeByUserA: async ({ userA, recipeData }, use) => {
    const recipe = await createRecipeViaApi(userA.token, recipeData);
    await use(recipe);
  },
});

export { expect } from '@playwright/test';
