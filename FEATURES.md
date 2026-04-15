# zbite — App Inventory & New Feature Plans

---

## Part 1: What zbite Has Today

### Core Identity
zbite is a social recipe platform with mood-based discovery, cooking gamification, and community features. Users discover recipes by mood/ingredients, cook with a step-by-step guide, track streaks, and engage socially.

### Pages & Routes (19 total)

| Route | Page | Auth | Purpose |
|-------|------|------|---------|
| `/` | Home | No | Personalized rows: Make It Again, interest rows, Quick in 30, Trending, Just Added |
| `/login` | Login | No | Email/password + Google OAuth |
| `/register` | SignUpWizard | No | Multi-step: username, email, password, pick interests (3+ tags) |
| `/choose` | Choose | No | Mood-based decider: "Help Me Decide" (category/time/preference) or "Use What I Have" (ingredients) |
| `/results` | Results | No | Recommendation results from Choose flow |
| `/feed` | FeedPage | No | Infinite scroll feed with tag filter + sort (trending, recent, topRated, quick, following) |
| `/search` | SearchPage | No | Full-text search across recipes and users |
| `/recipe/:id` | RecipeDetail | No | Full recipe view: cover, ingredients (scalable), steps, nutrition, comments, related, Cook Mode, "I Cooked This" |
| `/recipe/new` | RecipeWizard | Yes | Multi-step creation: Basics, Ingredients, Steps (with images), Cover Photo, Success |
| `/recipe/:id/edit` | EditRecipe | Yes | Edit own recipe |
| `/saved` | SavedRecipes | Yes | Bookmarked recipes grid with tag filtering |
| `/user/:id` | UserProfile | No | Profile: avatar, bio, recipes, stats, achievements, follow button |
| `/user/:id/followers` | Followers | No | Follower list |
| `/user/:id/following` | Following | No | Following list |
| `/activity` | Activity | Yes | Notifications grouped by Today/This Week/Earlier |
| `/leaderboard` | Leaderboard | No | Top chefs ranked by chefScore (weekly/monthly/all-time) |
| `/shopping-list` | ShoppingList | Yes | Grocery checklist populated from recipes |
| `*` | NotFound | - | 404 |

### API Endpoints (40+)

**Auth (5):** register, login, Google OAuth, get me, save interests
**Recipes (12):** CRUD, home feed, explore feed, following feed, search, recommend (category + pantry), user recipes, related, drafts
**Social (14):** comments (CRUD + replies), follows (follow/unfollow/status/lists), saves (save/unsave/status/bulk), notifications (list/count/read/delete)
**Gamification (4):** record cook, get streak, get achievements (self + others)
**Cooking Reports (2):** create "I Made This" report with photo, list reports per recipe
**Analytics (3):** creator overview, per-recipe metrics, daily engagement time-series
**Collections (6):** CRUD + add/remove recipes
**Shopping List (5):** get list, add recipe ingredients, toggle item, remove item, clear
**Other (2):** leaderboard, sitemap

### Data Models (10)

| Model | Key Fields |
|-------|------------|
| **User** | username, email, passwordHash?, googleId?, avatar, bio, interests[], recipesCount, followersCount, followingCount, chefScore |
| **Recipe** | title, description, author, tags[], systemTags[], difficulty, cookingTime, servings, ingredients[], steps[], nutrition, coverImage, status (draft/published), viewsCount, savesCount, commentsCount, reportsCount, recipeScore |
| **SavedRecipe** | user, recipe, savedAt |
| **Follow** | follower, following |
| **Comment** | user, recipe, text, parentComment?, repliesCount |
| **Notification** | recipient, sender, type (follow/save/comment/mention/cooking_report), recipe?, read |
| **CookingStreak** | user, currentStreak, longestStreak, lastCookDate, totalCooked |
| **Achievement** | user, type (first_cook/week_streak/month_streak/5_cuisines/10_recipes/50_recipes/first_report), unlockedAt |
| **CookingReport** | user, recipe, image, notes |
| **Collection** | name, description, owner, recipes[] |
| **ShoppingList** | owner, items[{name, amount, recipeId?, recipeTitle?, isChecked}] |

### Existing Gamification
- **Cooking streaks:** consecutive-day tracking, current/longest/total
- **Achievements:** 7 types unlocked by cook count, streak milestones, cuisine variety
- **chefScore:** per-user ranking = sum of all recipe scores
- **recipeScore:** `(saves * 2) + (comments * 1.5) + (cooks * 3)`
- **Leaderboard:** weekly/monthly/all-time rankings

### Existing Notifications
- **Server-side only** (no push, no WebSocket) — stored in MongoDB, fetched on page load
- **Types:** follow, save, comment, mention, cooking_report
- **UI:** Activity page with grouped timeline, unread badge count in nav
- **Gap:** no real-time delivery — user must refresh or navigate to `/activity`

### Existing Cook Mode
- Full-screen overlay with step-by-step navigation
- Progress bar, Previous/Next buttons, step images
- Screen wake lock to prevent sleep
- "Finish Cooking" button records cook event + shows toast
- **Gap:** exits immediately after finish — no celebration, no streak display

---

## Part 2: New Features to Add

---

### Feature A: Enhanced Notifications (Real-Time Push)

#### What It Does
Move from poll-on-page-load notifications to real-time delivery. When someone saves your recipe, follows you, or comments — you see it instantly without refreshing.

#### Current State
Notifications exist server-side (`Notification` model, 5 types, Activity page). But they're only fetched when the user navigates to `/activity` or when `useUnreadCount` polls. There's no push mechanism.

#### Approach: Server-Sent Events (SSE)

**Why SSE over WebSockets:**
- Unidirectional (server to client) is exactly what notifications need — user never pushes notifications upstream
- Works over HTTP/2 with zero extra infrastructure — no Socket.io server, no Redis pub/sub
- Automatic reconnection built into the browser `EventSource` API
- Fastify supports SSE natively — no new dependency
- Simpler to deploy on Render (no sticky sessions needed like WebSocket)

**Why NOT WebSockets:**
- WebSocket requires bidirectional connection — overkill for "server tells client something happened"
- Needs socket management (rooms, reconnection logic, heartbeat)
- Harder to deploy behind reverse proxies / Render's architecture
- Would need `socket.io` or `ws` library + Redis adapter for scaling

**Why NOT Firebase Cloud Messaging (FCM):**
- Adds Google dependency + Firebase SDK bundle size
- Requires service worker setup for web push
- Over-engineered for an in-app notification bell — FCM is for push notifications when the app is closed
- We can add FCM later on top of SSE if we want browser push notifications

#### Implementation Plan

**Server changes:**

1. **New SSE endpoint:** `GET /api/notifications/stream` (authenticated)
   - Opens a long-lived SSE connection
   - Sends `event: notification` with JSON payload when a new notification is created
   - Heartbeat ping every 30s to keep connection alive
   - File: `server/src/modules/social/social.routes.ts` — add route
   - File: `server/src/modules/social/social.controller.ts` — add SSE handler

2. **In-memory connection registry:** `server/src/shared/utils/sse-connections.ts`
   - `Map<userId, Set<FastifyReply>>` — tracks active SSE connections per user
   - `addConnection(userId, reply)`, `removeConnection(userId, reply)`, `sendToUser(userId, data)`
   - When a user has multiple tabs open, all tabs get the event

3. **Modify `createNotification`:** `server/src/shared/utils/notify.ts`
   - After saving to DB, call `sendToUser(recipient, notification)` to push via SSE
   - Non-blocking — if no SSE connection exists, notification is still persisted in DB

**Client changes:**

4. **New hook:** `client/src/hooks/useNotificationStream.ts`
   - Creates `EventSource` connection to `/api/notifications/stream` with auth token
   - On `notification` event: increment unread count, optionally show toast
   - Auto-reconnects on disconnect (built into EventSource API)
   - Cleans up on unmount

5. **Modify `useUnreadCount`:** `client/src/hooks/useUnreadCount.ts`
   - Integrate with SSE stream — increment count on real-time events
   - Keep initial fetch on mount as fallback (for missed events during offline)

6. **Optional toast on notification:** Show a subtle toast for high-value notifications (someone cooked your recipe, new follower). Don't toast every save — too noisy.

#### Pros
- Instant feedback — recipe authors see saves/comments in real-time
- Simple server-side (no new infra, no Redis)
- Progressive enhancement — falls back to poll if SSE fails
- Low bandwidth (SSE is lightweight, text-based)

#### Cons
- SSE connection per user = long-lived HTTP connection. At scale (10K+ concurrent users) this needs monitoring. For current app size: fine.
- SSE doesn't work through some corporate proxies that buffer responses. Rare, but possible.
- Memory: connection registry lives in-process. If you deploy multiple server instances later, each instance only knows its own connections. Fix: add Redis pub/sub when you need horizontal scaling.

#### Pitfalls to Watch
- **Connection leak:** Must remove from registry on disconnect/error. Use `reply.raw.on('close', cleanup)`.
- **Auth token expiry:** If JWT expires mid-stream, SSE stays open. Acceptable — worst case user misses events until page refresh.
- **Don't over-notify:** Someone rapidly saving/unsaving shouldn't spam. Debounce or skip duplicate notifications server-side (already handled — createNotification doesn't dedupe, but the same action type for the same recipe won't repeat because save/unsave toggling deletes the notification).

#### Files to Change

| File | Action |
|------|--------|
| `server/src/shared/utils/sse-connections.ts` | **Create** — SSE connection registry |
| `server/src/shared/utils/notify.ts` | **Modify** — push via SSE after DB save |
| `server/src/modules/social/social.routes.ts` | **Modify** — add `/notifications/stream` |
| `server/src/modules/social/social.controller.ts` | **Modify** — add SSE handler |
| `client/src/hooks/useNotificationStream.ts` | **Create** — EventSource hook |
| `client/src/hooks/useUnreadCount.ts` | **Modify** — integrate SSE events |

---

### Feature B: Cooking Completion State

#### What It Does
After a user finishes cooking (taps "Finish Cooking" in Cook Mode), instead of immediately exiting back to the recipe detail, show a **celebration screen** with:
- Success message: "Nice. You cooked today."
- Current streak count (e.g., "3 days in a row")
- Achievement unlocked (if any were just earned)
- Optional: share prompt or "I Made This" photo CTA

#### Current State
Cook Mode (`CookMode.tsx`) calls `recordCook()` fire-and-forget, shows a toast "Nice cook! Added to your streak", and immediately calls `onExit()`. The user sees the toast briefly over the recipe detail page. There's no dedicated moment of celebration.

#### Why This Matters
The "finish cooking" moment is the **highest engagement point** in the entire app. The user just spent 20-60 minutes following your recipe. Immediately dumping them back to the recipe page wastes this moment. A 3-5 second celebration screen:
- Reinforces the streak habit (show the streak number prominently)
- Creates a natural place to prompt "I Made This" photo sharing
- Makes the gamification system visible and rewarding

#### Approach: Completion Step Inside CookMode

**Why not a separate page/route?**
- CookMode is a full-screen overlay — adding a completion step within it is natural
- No route change needed, no navigation, no URL pollution
- The overlay already handles its own state (current step index)
- Simply add a `isCompleted` state that swaps the step content for a celebration screen

**Implementation Plan:**

1. **Modify CookMode to return streak data:** Currently `recordCook` is fire-and-forget. Change it to `await` and capture the returned `CookingStreak` object.

   **Modify:** `client/src/features/gamification/api/gamification.ts`
   - `recordCook` already returns the streak data from the server, we just need to use it

   **Modify:** `server/src/modules/gamification/gamification.controller.ts`
   - Already returns `{ streak }` — verify response includes `currentStreak`, `longestStreak`, `totalCooked`

2. **Add completion state to CookMode:**

   **Modify:** `client/src/features/recipes/components/CookMode/CookMode.tsx`
   - Add `isCompleted` state (boolean, default false)
   - Add `streakData` state (CookingStreak | null)
   - On "Finish Cooking" click: set loading, await `recordCook`, store streak data, set `isCompleted = true`
   - When `isCompleted` is true, render `CompletionScreen` instead of step content
   - "Done" button on completion screen calls `onExit()`

3. **New component:** `client/src/features/recipes/components/CookMode/CompletionScreen.tsx`
   - Receives: `streak: CookingStreak`, `recipeName: string`, `onDone: () => void`, `onSharePhoto: () => void`
   - Displays:
     - Checkmark animation or icon
     - "Nice. You cooked today." heading
     - Streak pill: "Day {currentStreak}" with flame icon (only if streak > 1)
     - If an achievement was just unlocked: show badge with name
     - Two CTAs: "Share a Photo" (opens CookingReport flow) and "Done" (exits)
   - Keep it minimal — 3-5 seconds of celebration, not a full page

4. **Modify CookMode CSS:**

   **Modify:** `client/src/features/recipes/components/CookMode/CookMode.module.css`
   - Add `.completionScreen` — centered, dark overlay, large text
   - Add `.streakBadge` — pill with flame icon and number
   - Add `.completionTitle` — large bold heading
   - Add `.completionActions` — button row (Share Photo + Done)

#### Achievement Detection
The `recordCook` endpoint already evaluates achievements. But currently it doesn't return *which* achievements were newly unlocked. Two options:

**Option A (simpler):** Server returns the full streak object + a `newAchievements: string[]` array in the `/gamification/cook` response. The service already knows which achievements it just created (the `evaluateAchievements` function creates them). Add a return value.

**Option B (no server change):** Client compares pre/post achievement lists. Too many API calls — not worth it.

Go with **Option A**: modify `GamificationService.recordCook` to return `{ streak, newAchievements }`.

#### Pros
- Turns the most important moment into a reward moment
- Makes streaks visible (currently hidden in profile/gamification)
- Natural place for "I Made This" photo prompt — increases cooking report submissions
- Tiny code change — 1 new sub-component + state addition to CookMode

#### Cons
- Adds ~3-5 seconds before user can exit. Some users may find it annoying.
  - Mitigation: "Done" button is always visible — user can skip instantly
- `recordCook` becomes blocking (must await for streak data). Currently fire-and-forget.
  - Mitigation: add loading spinner on the "Finish Cooking" button (500ms typical). Acceptable.

#### Pitfalls
- **Offline/error:** If `recordCook` API fails, still show completion screen but without streak data. Don't let an API error ruin the celebration. Show "Nice. You cooked today." without streak numbers.
- **Already cooked today:** `recordCook` returns existing streak without incrementing. The message should still be positive — "Nice. You cooked today." works regardless.
- **Guest user:** No streak to show. Just show "Nice work!" and the Done button. Skip the streak pill.

#### Files to Change

| File | Action |
|------|--------|
| `server/src/modules/gamification/gamification.service.ts` | **Modify** — return `newAchievements` from `recordCook` |
| `server/src/modules/gamification/gamification.controller.ts` | **Modify** — include `newAchievements` in response |
| `client/src/features/recipes/components/CookMode/CookMode.tsx` | **Modify** — add `isCompleted` state, await recordCook |
| `client/src/features/recipes/components/CookMode/CompletionScreen.tsx` | **Create** — celebration screen |
| `client/src/features/recipes/components/CookMode/CookMode.module.css` | **Modify** — completion styles |

---

### Feature C: Enhanced Cooking Mode

#### What It Does
Improve the existing Cook Mode with:
- Larger, more readable text
- Cleaner step-by-step navigation
- Fewer distractions (remove the static "Kitchen Tip" and full ingredient list from every step)
- Only show relevant ingredients per step (or on demand)

#### Current State
CookMode exists and works (`CookMode.tsx`). It has: step-by-step navigation, progress bar, step images, wake lock. But it also shows a static "Kitchen Tip" ("Take your time with this step. Good cooking is never rushed.") on every step and a full ingredient list on every step — both are noisy and unhelpful.

#### What to Change

1. **Remove static Kitchen Tip** — it's the same generic text on every step. Adds clutter without value. If we want tips, they should be step-specific (authored per step). But the `steps` schema doesn't have a `tip` field, and adding one is a bigger change. For now: remove the generic tip entirely.

2. **Remove full ingredient list from every step** — showing all ingredients on every step is noise. Instead: add a collapsible "Ingredients" drawer at the bottom that the user can open if they need to check something. Default: collapsed.

3. **Increase text size** — step instruction text should be 20-22px (currently inherits from the CSS, likely 16px). Users are standing in a kitchen, often at arm's length from the phone.

4. **Simplify navigation** — current Previous/Next buttons are fine. Add swipe gesture support for mobile (optional — nice to have, not critical).

5. **Step timer (optional future)** — some recipes have time-based steps ("simmer for 15 minutes"). A built-in timer would be valuable but requires step schema changes. Flag for future, don't implement now.

#### Implementation Plan

**Modify:** `client/src/features/recipes/components/CookMode/CookMode.tsx`
- Remove the `tip` section entirely (lines 67-72)
- Replace the full `ingredients` list with a toggle button: "Show Ingredients" — when tapped, shows ingredient list as a sliding panel or expandable section
- Add state: `isIngredientsOpen` (boolean, default false)

**Modify:** `client/src/features/recipes/components/CookMode/CookMode.module.css`
- `.stepText` — increase `font-size` to 20px, `line-height` to 1.6
- `.stepTitle` — increase to 24px bold
- Remove `.tip`, `.tipLabel`, `.tipText` styles
- Add `.ingredientToggle` — button style for "Show Ingredients"
- Add `.ingredientDrawer` — collapsible panel with transition
- Increase button sizes (Previous/Next) for touch targets

#### Pros
- Cleaner, more focused cooking experience
- Larger text = better readability in kitchen
- Ingredient list available on demand, not forced

#### Cons
- Removing the tip section removes a "warm" touch. Some users might miss it.
  - Mitigation: the tip was generic/useless. Real per-step tips would be better but require schema changes.
- Collapsible ingredients adds a tap — slightly more effort to see ingredients.
  - Mitigation: ingredients are most relevant at step 1. Most users won't need them mid-cook.

#### Files to Change

| File | Action |
|------|--------|
| `client/src/features/recipes/components/CookMode/CookMode.tsx` | **Modify** — remove tip, add ingredient toggle |
| `client/src/features/recipes/components/CookMode/CookMode.module.css` | **Modify** — larger text, collapsible ingredients, remove tip styles |

---

### Feature D: Smart Meal Suggestion ("Tonight's Dinner")

#### What It Does
When the user opens the app, show a focused section at the top of the Home page:
- **Title changes by time of day:** "Tonight's Dinner" (evening), "Good Morning — Breakfast" (morning), "Lunch Break" (midday)
- **3 recipe cards only** — focused, no scrolling, decision-friendly
- Each card: image, title, cooking time, 1 key tag
- Below: "Show more options" button (navigates to feed with appropriate filters)

#### Priority Logic for the 3 Recipes
1. **Saved recipes** that match the current meal time — highest priority
2. **Recipes with tags matching user interests** + meal time relevance
3. **Popular fallback** — trending recipes under 45 minutes

#### Current State
Home page has personalized rows (Make It Again, interest rows, Quick in 30, Trending, Just Added) but none are time-aware. The "Make It Again" row shows saved recipes but doesn't filter by meal time.

#### Challenge: We Don't Have Meal Time Tags Yet

This feature depends on **knowing which recipes are appropriate for breakfast vs dinner**. Currently recipes have Cuisine, Dish Type, and Dietary tags — none are meal-time-based. Two options:

**Option 1: Add Meal Type Tags first** (Feature F below)
- Add `MEAL_TYPE_TAGS = ['Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Snack']` to the tag system
- Recipe creators tag their recipes with meal types
- The smart suggestion queries by tag: `tags: { $in: ['Dinner'] }` for evening
- **Pro:** accurate, user-authored data
- **Con:** existing recipes have no meal type tags — feature is empty until creators re-tag

**Option 2: Heuristic inference (no new tags)**
- Morning: prefer recipes tagged "Baking", "Quick Meals", with cookingTime < 20 min
- Lunch: prefer "Salad", "Soup", "Quick Meals", cookingTime < 30 min
- Dinner: prefer recipes with cookingTime > 20 min, exclude breakfast-ish categories
- **Pro:** works immediately with existing data
- **Con:** heuristics are wrong often (is "Pasta" lunch or dinner? Both). Hard to maintain.

**Recommendation: Option 1 (Meal Type Tags) + graceful fallback**
- Implement Meal Type Tags first (Feature F below)
- Smart suggestion queries by meal type tag
- If no tagged recipes found, fall back to interest-based + time-filtered (Option 2 logic as fallback)
- Over time, as more recipes get tagged, the feature improves

#### Implementation Plan

**Server changes:**

1. **New endpoint:** `GET /api/recipes/meal-suggestion` (optionalAuth)
   - Query params: `mealType` (breakfast | lunch | dinner | snack)
   - Returns: `{ suggestions: IRecipe[], mealType: string }`
   - Logic:
     - If authenticated: check saved recipes with matching meal type tag, take up to 3
     - If not enough: fill with interest-matched recipes with meal type tag
     - If still not enough: popular recipes under 45 min cookingTime
     - Always return exactly 3 (or fewer if not enough recipes exist)

   **Files:**
   - `server/src/modules/recipe/recipe.routes.ts` — add route
   - `server/src/modules/recipe/recipe.controller.ts` — add handler
   - `server/src/modules/recipe/recipe.service.ts` — add `getMealSuggestions` method
   - `server/src/modules/recipe/recipe.dal.ts` — add queries

**Client changes:**

2. **Meal type detection utility:** `client/src/utils/getMealType.ts`
   - Pure function: `getMealType(hour: number): 'breakfast' | 'lunch' | 'dinner' | 'snack'`
   - 5-10 AM = breakfast, 11-14 = lunch, 17-21 = dinner, else = snack
   - Named constants for time boundaries

3. **New hook:** `client/src/pages/Home/hooks/useMealSuggestion.ts`
   - Calls `/recipes/meal-suggestion?mealType=${getMealType(currentHour)}`
   - Returns `{ recipes: Recipe[], mealType: string, isLoading: boolean }`

4. **New component:** `client/src/pages/Home/components/MealSuggestion/MealSuggestion.tsx`
   - Title map: breakfast = "Good Morning", lunch = "Lunch Break", dinner = "Tonight's Dinner", snack = "Snack Time"
   - Renders 3 recipe cards in a clean, focused layout (not a scrollable row — a grid or stack)
   - Each card: cover image, title, cookingTime, first tag
   - "Show more options" button navigates to `/feed?tag=${mealType}`
   - Conditionally renders: if `recipes.length === 0`, don't show the section

5. **Modify Home page:**

   **Modify:** `client/src/pages/Home/Home.tsx`
   - Add `MealSuggestion` as the **first section** after `HeroSection`, before all `LeaderboardRow`s
   - Only render if user is logged in (guests get generic home)

#### Pros
- Makes the app feel intelligent and personal — "it knows it's dinner time"
- Reduces decision fatigue — 3 choices instead of infinite scroll
- High engagement potential — "Tonight's Dinner" is the single most valuable moment in a recipe app
- Drives saved recipe usage (saved recipes appear first)

#### Cons
- **Cold start:** New users with no saved recipes and no meal-type-tagged recipes get a weak experience. Fallback to popular/quick recipes mitigates this.
- **Time zone:** Uses browser `new Date().getHours()` which is local time. Works correctly. But a user in a different timezone than expected could see "Tonight's Dinner" at 10 AM if their system clock is wrong. Edge case — acceptable.
- **Meal type tags dependency:** Feature quality depends on recipe creators adding meal type tags. Until critical mass, fallback logic carries the experience.

#### Pitfalls
- **Don't hardcode meal type boundaries too rigidly.** Some people eat dinner at 5 PM, others at 9 PM. The time ranges should be generous overlapping windows, not strict cutoffs.
- **Don't show the same 3 recipes every time.** Add light randomization — if there are 10 matching recipes, randomly pick 3 from the top-scored. Otherwise the user sees identical suggestions every visit.
- **Performance:** This is a new API call on every Home page load. Keep it fast — simple indexed query. Don't run expensive aggregations.

#### Files to Change

| File | Action |
|------|--------|
| `server/src/modules/recipe/recipe.routes.ts` | **Modify** — add `/meal-suggestion` |
| `server/src/modules/recipe/recipe.controller.ts` | **Modify** — add handler |
| `server/src/modules/recipe/recipe.service.ts` | **Modify** — add `getMealSuggestions` |
| `server/src/modules/recipe/recipe.dal.ts` | **Modify** — add meal suggestion queries |
| `client/src/utils/getMealType.ts` | **Create** — time to meal type utility |
| `client/src/pages/Home/hooks/useMealSuggestion.ts` | **Create** — fetch hook |
| `client/src/pages/Home/components/MealSuggestion/MealSuggestion.tsx` | **Create** — suggestion UI |
| `client/src/pages/Home/components/MealSuggestion/MealSuggestion.module.css` | **Create** — styles |
| `client/src/pages/Home/Home.tsx` | **Modify** — add MealSuggestion section |

---

### Feature E: Data Tracking (Minimal, Purposeful)

#### What It Does
Track three user actions: **viewed**, **saved**, **cooked**. Use this data to improve personalization (home page, suggestions) and give creators meaningful analytics.

#### Current State — What Already Exists

| Action | Already Tracked? | Where |
|--------|-----------------|-------|
| **Recipe viewed** | YES — `viewsCount` incremented on `getRecipe()` | `recipe.service.ts` line 116: fire-and-forget `$inc: { viewsCount: 1 }` |
| **Recipe saved** | YES — `SavedRecipe` model + `savesCount` on recipe | `social.service.ts` save/unsave methods |
| **Recipe cooked** | YES — `CookingStreak.totalCooked` + `CookingReport` model + `reportsCount` on recipe | `gamification.service.ts` recordCook + cooking-report module |

**All three are already tracked.** The data exists in the database. The issue is:

1. **Views are anonymous and aggregate** — we know recipe X has 500 views, but not *which users* viewed it. This means we can't build "recently viewed by you" or "because you looked at X" recommendations.

2. **Cooks are not linked to specific recipes** — `CookingStreak` tracks total cook count but not *which* recipes were cooked. `CookingReport` tracks which recipes (with photo proof), but not every cook results in a report. The `POST /gamification/cook` endpoint receives `recipeId` in the body but the service ignores it — it only updates the streak counter.

3. **No unified activity log** — views, saves, and cooks are in different collections with different schemas. No way to query "show me everything this user did recently."

#### What Needs to Change

**Option A: Per-user view tracking (new UserActivity model)**
Create a lightweight `UserActivity` collection:
```
{ user, action: 'view' | 'save' | 'cook', recipe, createdAt }
```
This enables: recently viewed, "because you viewed X", cook history per recipe, full activity timeline.

**Concern:** Views are high-frequency. If a user views 50 recipes/day, that's 50 writes/day per user. At 1000 active users = 50K writes/day. MongoDB handles this fine, but it's worth capping (e.g., only store last 100 views per user, or deduplicate within 1 hour).

**Option B: Fix existing gaps, don't create new model**
- Store `userId` on view increment (add to existing fire-and-forget)
- Store `recipeId` in CookingStreak or separate CookHistory
- Use SavedRecipe as-is (already per-user)

**Recommendation: Option A (UserActivity model) with sensible limits**
- One unified model is cleaner than patching three separate systems
- Enables future features (recently viewed, cook history, personalized recommendations)
- Cap at 200 entries per user (TTL index or periodic cleanup)
- View tracking is fire-and-forget (non-blocking, like current viewsCount)

#### Implementation Plan

**Server:**

1. **New model:** `server/src/models/UserActivity.ts`
   - `user` (ObjectId, required)
   - `action` (enum: 'view' | 'save' | 'cook')
   - `recipe` (ObjectId, required)
   - `createdAt` (Date, TTL index to auto-expire after 90 days)
   - Indexes: `(user, action, createdAt)` for efficient per-user queries
   - Compound index: `(user, action, recipe)` for deduplication checks

2. **New utility:** `server/src/shared/utils/track-activity.ts`
   - `trackActivity(userId, action, recipeId)` — fire-and-forget
   - For 'view': deduplicate — don't record if same user+recipe within last hour
   - For 'save'/'cook': always record (these are intentional actions)

3. **Wire into existing flows:**
   - `recipe.service.ts` getRecipe(): after view count increment, call `trackActivity(userId, 'view', recipeId)` — only if userId is available (authenticated)
   - `social.service.ts` saveRecipe(): call `trackActivity(userId, 'save', recipeId)`
   - `gamification.service.ts` recordCook(): call `trackActivity(userId, 'cook', recipeId)` — requires passing recipeId through, which currently isn't stored

4. **Fix recordCook to track which recipe:**
   - Currently `POST /gamification/cook` receives `{ recipeId }` but the service only does `streak.totalCooked + 1`. The recipeId is ignored.
   - Modify `GamificationService.recordCook(userId, recipeId)` to accept recipeId
   - Pass it to `trackActivity`

5. **New endpoint (optional, for future "recently viewed"):** `GET /api/user/activity?action=view&limit=20`
   - Returns recent activities for the authenticated user
   - Useful for building "Recently Viewed" row on Home page (server-side, not localStorage)

**Client:** No immediate client changes needed. The tracking happens server-side transparently. Future features (recently viewed row, "because you viewed X") will consume this data.

#### Pros
- Unified activity log enables many future features
- TTL index auto-cleans old data — no manual maintenance
- Fire-and-forget writes don't slow down the user experience
- Fixes the "which recipes did I cook?" gap

#### Cons
- More DB writes (every authenticated view = 1 write). At current scale: negligible.
- 90-day TTL means old data disappears. If you want lifetime analytics, keep the existing aggregate counters (viewsCount, savesCount, etc.) — UserActivity is for personalization, not lifetime stats.

#### Pitfalls
- **Don't make view tracking blocking.** It must remain fire-and-forget. If the DB write fails, the user should never notice.
- **Deduplication is important for views.** Without it, a user refreshing a recipe page 10 times creates 10 "view" records. The 1-hour dedup window prevents this.
- **Privacy consideration:** You're now storing per-user browsing history. Make sure this is mentioned in your privacy policy. Allow users to clear their activity if requested.

#### Files to Change

| File | Action |
|------|--------|
| `server/src/models/UserActivity.ts` | **Create** — unified activity model |
| `server/src/shared/utils/track-activity.ts` | **Create** — fire-and-forget tracking utility |
| `server/src/modules/recipe/recipe.service.ts` | **Modify** — add view tracking in `getRecipe` |
| `server/src/modules/social/social.service.ts` | **Modify** — add save tracking |
| `server/src/modules/gamification/gamification.service.ts` | **Modify** — accept recipeId, add cook tracking |
| `server/src/modules/gamification/gamification.controller.ts` | **Modify** — pass recipeId to service |

---

### Feature F: Meal Type Tags

#### What It Does
Add a new tag category: `['Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Snack']`. Recipe creators can tag when you'd eat it. This feeds into Feature D (Smart Meal Suggestion) and improves discovery.

#### Current State
3 tag categories exist: Cuisine (14), Dish Type (11), Dietary (8) = 33 total tags. Max 5 tags per recipe. `ALL_TAGS` is the source of truth — Zod validation, TagChips component, and FilterBar all derive from it.

#### Implementation Plan

1. **Server:** `server/src/constants/tags.ts` — add `MEAL_TYPE_TAGS`, update `ALL_TAGS`
2. **Client:** `client/src/types/index.ts` — mirror the same
3. **SignUpWizard:** `client/src/pages/SignUpWizard/SignUpWizard.tsx` — add "Meal Type" to `TAG_SECTIONS`
4. **BasicsStep (recipe creation):** `client/src/features/recipes/components/wizard-steps/BasicsStep.tsx` — group tags by category (4 sections with labels) instead of flat list
5. **RecipeWizard CSS:** `client/src/pages/CreateRecipe/RecipeWizard.module.css` — add `.tagSectionLabel` style
6. **FilterBar:** No changes — uses `ALL_TAGS` default, new tags appear automatically

#### Files to Change

| File | Action |
|------|--------|
| `server/src/constants/tags.ts` | **Modify** — add `MEAL_TYPE_TAGS`, update `ALL_TAGS` |
| `client/src/types/index.ts` | **Modify** — mirror tags |
| `client/src/pages/SignUpWizard/SignUpWizard.tsx` | **Modify** — add section |
| `client/src/features/recipes/components/wizard-steps/BasicsStep.tsx` | **Modify** — grouped tag sections |
| `client/src/pages/CreateRecipe/RecipeWizard.module.css` | **Modify** — section label style |

---

## Recommended Implementation Order

1. **Feature F (Meal Type Tags)** — pure data, prerequisite for Feature D
2. **Feature E (Data Tracking)** — foundational, enables future personalization
3. **Feature C (Enhanced Cook Mode)** — quick UI cleanup, independent
4. **Feature B (Completion State)** — builds on Cook Mode, adds celebration
5. **Feature D (Smart Meal Suggestion)** — depends on F (tags) and benefits from E (tracking)
6. **Feature A (Real-Time Notifications)** — independent, can be done anytime

---

## How to Verify

1. `cd server && npm run build` — compiles
2. `cd client && npm run build` — compiles
3. `cd server && npm test` — all tests pass
4. **Meal Type Tags:** Create a recipe, BasicsStep shows 4 grouped tag sections, select "Breakfast", publish, appears with tag on feed, FilterBar shows "Breakfast" option
5. **Data Tracking:** Open a recipe while logged in, check DB for UserActivity with action "view", save it, check for "save" activity, cook it, check for "cook" activity
6. **Enhanced Cook Mode:** Enter Cook Mode, no "Kitchen Tip" visible, text is large, tap "Show Ingredients", ingredient drawer opens/closes, navigation works
7. **Completion State:** Finish cooking, celebration screen appears with streak count, tap "Done", exits to recipe detail
8. **Smart Meal Suggestion:** Open home page at 7 PM, "Tonight's Dinner" section shows 3 recipes, tap "Show more options", goes to feed filtered by dinner
9. **Real-Time Notifications:** Open app in 2 tabs, Tab A saves a recipe, Tab B receives notification badge increment in real-time
