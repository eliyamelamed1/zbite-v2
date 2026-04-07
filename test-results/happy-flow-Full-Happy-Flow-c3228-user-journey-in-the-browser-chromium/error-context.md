# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: happy-flow.spec.ts >> Full Happy Flow >> complete user journey in the browser
- Location: e2e\happy-flow.spec.ts:56:7

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for getByText('Following').first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e5]:
      - link "zbite" [ref=e6] [cursor=pointer]:
        - /url: /
      - generic [ref=e7]:
        - generic [ref=e8]: 🔍
        - textbox "Search curated recipes..." [ref=e9]
      - generic [ref=e10]:
        - link "Home" [ref=e11] [cursor=pointer]:
          - /url: /
        - link "Explore" [ref=e12] [cursor=pointer]:
          - /url: /explore
        - generic [ref=e13]:
          - link "Log In" [ref=e14] [cursor=pointer]:
            - /url: /login
            - button "Log In" [ref=e15]
          - link "Sign Up" [ref=e16] [cursor=pointer]:
            - /url: /register
            - button "Sign Up" [ref=e17]
  - generic [ref=e19]:
    - heading "Welcome back" [level=1] [ref=e20]
    - paragraph [ref=e21]: Log in to your account
    - generic [ref=e22]:
      - generic [ref=e23]: Email
      - textbox [ref=e24]
    - generic [ref=e25]:
      - generic [ref=e26]: Password
      - textbox [ref=e27]
    - button "Log In" [ref=e28] [cursor=pointer]
    - paragraph [ref=e29]:
      - text: Don't have an account?
      - link "Sign up" [ref=e30] [cursor=pointer]:
        - /url: /register
```

# Test source

```ts
  100 | 
  101 |     // Step 4 — Steps + Nutrition + Publish
  102 |     await expect(page.getByText('Recipe Steps')).toBeVisible();
  103 |     await page.getByPlaceholder('Step title').first().fill('Boil pasta');
  104 |     await page.getByPlaceholder('Describe the cooking process').first().fill('Boil water and cook pasta until al dente.');
  105 |     await page.getByPlaceholder('Calories').fill('450');
  106 |     await page.getByPlaceholder('Protein (g)').fill('25');
  107 |     await page.getByPlaceholder('Carbs (g)').fill('50');
  108 |     await page.getByPlaceholder('Fat (g)').fill('18');
  109 |     // Click publish button (the "Next Step" button on step 4)
  110 |     await page.getByRole('button', { name: /Next Step|Publishing/i }).click();
  111 | 
  112 |     // ═══════════════════════════════════════════
  113 |     // 4. RECIPE PUBLISHED
  114 |     // ═══════════════════════════════════════════
  115 |     await expect(page.getByText('Recipe Published!')).toBeVisible({ timeout: 15000 });
  116 |     await page.getByRole('button', { name: /View Recipe/i }).click();
  117 | 
  118 |     // ═══════════════════════════════════════════
  119 |     // 5. VIEW RECIPE DETAIL
  120 |     // ═══════════════════════════════════════════
  121 |     await expect(page.getByText('Pasta Carbonara')).toBeVisible();
  122 |     await expect(page.getByText('Spaghetti')).toBeVisible();
  123 |     await expect(page.getByText('450')).toBeVisible(); // calories
  124 | 
  125 |     // Save recipe URL for later
  126 |     const recipeUrl = page.url();
  127 | 
  128 |     // ═══════════════════════════════════════════
  129 |     // 6. CHECK EXPLORE — recipe appears
  130 |     // ═══════════════════════════════════════════
  131 |     await page.goto('/explore');
  132 |     await expect(page.getByText('Pasta Carbonara').first()).toBeVisible();
  133 | 
  134 |     // ═══════════════════════════════════════════
  135 |     // 7. LOG OUT USER A
  136 |     // ═══════════════════════════════════════════
  137 |     await logout(page);
  138 | 
  139 |     // ═══════════════════════════════════════════
  140 |     // 8. SIGN UP AS USER B
  141 |     // ═══════════════════════════════════════════
  142 |     await signUp(page, userB, ['Vegan', 'Seafood', 'Desserts']);
  143 | 
  144 |     // ═══════════════════════════════════════════
  145 |     // 9. FIND RECIPE ON EXPLORE
  146 |     // ═══════════════════════════════════════════
  147 |     await page.goto('/explore');
  148 |     await expect(page.getByText('Pasta Carbonara').first()).toBeVisible();
  149 |     await page.getByText('Pasta Carbonara').first().click();
  150 | 
  151 |     // ═══════════════════════════════════════════
  152 |     // 10. INTERACT — like, rate, comment
  153 |     // ═══════════════════════════════════════════
  154 |     await expect(page.getByText('Pasta Carbonara').first()).toBeVisible();
  155 | 
  156 |     // Like — click the heart (first button in action bar)
  157 |     const actionBtns = page.locator('[class*="bar"] > button');
  158 |     await actionBtns.first().click();
  159 |     await page.waitForTimeout(500);
  160 | 
  161 |     // Rate — click 5th star
  162 |     const stars = page.locator('[class*="wrapper"] button, [class*="star"]').filter({ hasText: '★' });
  163 |     if (await stars.count() >= 5) {
  164 |       await stars.nth(4).click();
  165 |       await page.waitForTimeout(500);
  166 |     }
  167 | 
  168 |     // Comment
  169 |     const commentInput = page.getByPlaceholder('Write a comment...');
  170 |     if (await commentInput.isVisible()) {
  171 |       await commentInput.fill('Amazing recipe!');
  172 |       await page.getByRole('button', { name: 'Post' }).click();
  173 |       await expect(page.getByText('Amazing recipe!').first()).toBeVisible();
  174 |     }
  175 | 
  176 |     // ═══════════════════════════════════════════
  177 |     // 11. FOLLOW USER A — find their profile by searching
  178 |     // ═══════════════════════════════════════════
  179 |     // Use the search in the navbar to find User A
  180 |     await page.getByPlaceholder('Search curated recipes...').fill(userA.username);
  181 |     await page.waitForTimeout(1000);
  182 |     // Click the search result dropdown item
  183 |     const searchResult = page.getByText(`@${userA.username}`).first();
  184 |     await searchResult.click();
  185 |     await page.waitForTimeout(1000);
  186 | 
  187 |     // Should be on User A's profile
  188 |     await expect(page.getByText(`@${userA.username}`).first()).toBeVisible();
  189 |     const followBtn = page.getByRole('button', { name: 'Follow' });
  190 |     if (await followBtn.isVisible()) {
  191 |       await followBtn.click();
  192 |       await page.waitForTimeout(1000);
  193 |     }
  194 | 
  195 |     // ═══════════════════════════════════════════
  196 |     // 12. CHECK FOLLOWING FEED
  197 |     // ═══════════════════════════════════════════
  198 |     await page.goto('/feed');
  199 |     // Desktop uses sidebar links, not mobile tabs. Click "Following" in sidebar
> 200 |     await page.getByText('Following').first().click();
      |                                               ^ Error: locator.click: Test timeout of 120000ms exceeded.
  201 |     await page.waitForTimeout(2000);
  202 |     // Carbonara should appear from followed user
  203 |     await expect(page.getByText('Pasta Carbonara').first()).toBeVisible({ timeout: 10000 });
  204 | 
  205 |     // ═══════════════════════════════════════════
  206 |     // 13. LOG OUT USER B → LOG IN AS USER A
  207 |     // ═══════════════════════════════════════════
  208 |     await logout(page);
  209 |     await page.goto('/login');
  210 |     await page.locator('input[type="email"]').fill(userA.email);
  211 |     await page.locator('input[type="password"]').fill(userA.password);
  212 |     await page.locator('form').getByRole('button', { name: /Log In/i }).click();
  213 |     await page.waitForURL('**/explore', { timeout: 10000 });
  214 | 
  215 |     // ═══════════════════════════════════════════
  216 |     // 14. CHECK NOTIFICATIONS
  217 |     // ═══════════════════════════════════════════
  218 |     await page.goto('/activity');
  219 |     await expect(page.getByText(`@${userB.username}`).first()).toBeVisible({ timeout: 10000 });
  220 | 
  221 |     // ═══════════════════════════════════════════
  222 |     // DONE!
  223 |     // ═══════════════════════════════════════════
  224 |   });
  225 | });
  226 | 
```