import { test, expect } from '@playwright/test';

import { registerUserViaApi } from '../../../e2e/helpers/api-client';
import { createUserData, DEFAULT_INTERESTS } from '../../../e2e/fixtures/test-data';
import { LandingPage } from '../../../e2e/pages/LandingPage';
import { RegisterPage } from '../../../e2e/pages/RegisterPage';
import { LoginPage } from '../../../e2e/pages/LoginPage';
import { Navbar } from '../../../e2e/pages/components/Navbar';

test.describe('Auth', () => {
  test('landing page renders title and nav links', async ({ page }) => {
    const landing = new LandingPage(page);

    await landing.goto();

    await landing.expectTitleVisible();
    await expect(page.getByRole('link', { name: 'Log In', exact: true })).toBeVisible();
  });

  test('signup happy path via wizard', async ({ page }) => {
    const user = createUserData('signup');
    const registerPage = new RegisterPage(page);

    await registerPage.signUp(user, DEFAULT_INTERESTS);

    await expect(page).toHaveURL(/\/feed/);
  });

  test('login happy path', async ({ page }) => {
    const credentials = createUserData('login');
    await registerUserViaApi(credentials);
    const loginPage = new LoginPage(page);

    await loginPage.login(credentials.email, credentials.password);

    await expect(page).toHaveURL(/\/feed/);
  });

  test('login rejects wrong credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.fillEmail('nonexistent@test.com');
    await loginPage.fillPassword('wrongpassword');
    await loginPage.submitForm();

    await expect(page).toHaveURL(/\/login/);
  });

  test('logout redirects away from protected pages', async ({ page }) => {
    const credentials = createUserData('logout');
    const registered = await registerUserViaApi(credentials);

    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, registered.token);
    await page.goto('/feed');
    await expect(page).toHaveURL(/\/feed/);

    const navbar = new Navbar(page);
    await navbar.logout();

    await expect(page).not.toHaveURL(/\/feed/);
  });

  test('invalid URL shows 404 page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');

    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText("This recipe doesn't exist")).toBeVisible();
  });
});
