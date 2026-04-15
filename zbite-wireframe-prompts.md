# zbite — Wireframe Prompts for Figma

**App**: zbite — a recipe decision platform
**Style**: Warm, clean, modern. Cream/beige background, brown/orange accents, rounded corners, soft shadows, food photography.
**Primary font**: Sans-serif (Inter, SF Pro, or similar)
**Brand colors**: Warm cream (#FDF6EC) background, rich brown (#2D1810) text, orange-amber (#D4843E) primary accent

---

## Global Components

### Bottom Tab Bar (Mobile — shown on ALL screens except Login/Register)

> 5-tab bottom navigation bar, equal width:
> 1. Home (house icon) — navigates to Home page
> 2. Browse (compass/search icon) — navigates to Feed page
> 3. Create (+ icon in a circle, slightly larger/elevated) — navigates to Create Recipe (requires login)
> 4. Activity (bell icon, optional red dot badge) — navigates to Activity page (requires login)
> 5. Profile (person icon) — navigates to user profile (requires login)
>
> Active tab: filled icon + primary color label. Inactive: gray outline icons.
> Guests see all 5 tabs, but tapping Create/Activity/Profile redirects to Login page.

### Top Bar (Mobile)

> Left: Search magnifying glass icon (tapping navigates to Search page)
> Center: "zbite" logo text
> Right (logged in only): Shopping cart icon + bell icon with notification badge
> Right (guest): empty
> Height: ~56px, white/cream background, subtle bottom border

### Desktop Navbar

> Left: "zbite" logo (clickable, navigates to Home page)
> Left-center: Nav links — "Home" | "Browse" | "Leaderboard"
> Center: Search bar with placeholder "Search recipes & chefs..." (typing shows dropdown with recipe + chef results)
> Right (logged in): "+ Create" button (primary) | Bell icon (with badge) | User avatar (dropdown: Profile, Shopping List, Logout)
> Right (guest): "Log In" text button | "Sign Up" filled button
> Height: ~64px, white/cream background, subtle bottom border

---

## Screen 1: Home Page (Mobile)

### Design Prompt

> Design a mobile home page for a recipe app called "zbite". Warm, clean, modern UI.
>
> **Top bar**: Search icon on the left, "zbite" logo centered.
>
> **Hero section** (takes up ~40% of viewport): Large heading "What should I cook?" (28px bold) with subtext "Get the perfect recipe in seconds" (16px, secondary color). Below the text, two full-width buttons stacked vertically with 12px gap:
> - Primary filled button: "Help Me Choose" with a cooking pan icon
> - Secondary outline button: "Surprise Me" with a dice icon
> Subtle warm gradient background (cream to light peach) behind the hero. Optional: faint food illustration or pattern.
>
> **Below hero — 3 horizontal scroll sections**, each with a row header (left: section title bold, right: "See all >" link in primary color):
> 1. "Trending Now" (with fire icon) — horizontal row of 3-4 small recipe cards
> 2. "Top Rated" (with star icon) — same card layout
> 3. "Quick Wins" (with lightning icon) — same card layout
>
> **Preview card** (in scroll rows): ~140px wide. Square food image (rounded corners), below: recipe title (1 line, 13px bold), star rating + count (12px), cooking time (12px, with clock icon).
>
> **Bottom tab bar**: Home (active), Browse, Create, Activity, Profile.
>
> Rounded corners everywhere (12px cards, 24px buttons), soft card shadows, warm cream palette.

### User Flow

1. **User lands on Home page** — sees hero section immediately, no scrolling needed
2. **Taps "Help Me Choose"** → navigates to **Choose page (Step 1: Time)**
3. **Taps "Surprise Me"** → navigates to **Results page** with random quality recipes (no Choose steps)
4. **Scrolls down** → sees 3 horizontal recipe rows (Trending, Top Rated, Quick Wins)
5. **Taps a preview card** in any row → navigates to **Recipe Detail page** for that recipe
6. **Taps "See all >"** on Trending row → navigates to **Feed page** with sort pre-set to "Trending"
7. **Taps "See all >"** on Top Rated row → navigates to **Feed page** with sort pre-set to "Top Rated"
8. **Taps "See all >"** on Quick Wins row → navigates to **Feed page** with sort pre-set to "Quick"
9. **Taps Search icon** in top bar → navigates to **Search page**
10. **Taps any bottom tab** → navigates to corresponding page

---

## Screen 2: Home Page (Desktop)

### Design Prompt

> Design a desktop home page for "zbite" recipe app. 1200px max-width centered layout.
>
> **Top navbar**: "zbite" logo left, nav links (Home active, Browse, Leaderboard), centered search bar "Search recipes & chefs...", right side: "+ Create" button, bell icon, user avatar dropdown. If guest: "Log In" + "Sign Up" buttons instead.
>
> **Hero section**: Full-width warm gradient banner (cream to light peach). Large heading "What should I cook?" (48px bold) centered, subtext below (20px). Two buttons side by side centered with 16px gap: "Help Me Choose" (filled primary, 48px tall) and "Surprise Me" (outline, 48px tall). Generous vertical padding (80px top/bottom).
>
> **Below hero — 3 card rows** within max-width container. Each row: left-aligned section title + "See all >" link right-aligned. 4 recipe cards per row (equal width, ~280px each, 20px gap). No horizontal scroll needed.
>
> **Card design**: Square food image, rounded 12px corners, below: title (15px bold), star rating + count, clock icon + cooking time, author name (13px, gray). Hover: translateY(-4px) + deeper shadow.
>
> Clean, modern, generous whitespace between sections (48px).

### User Flow

Same as mobile, plus:
11. **Hovers over a card** → card lifts slightly with shadow
12. **Types in search bar** → dropdown shows recipe + chef results; pressing Enter navigates to **Search page**
13. **Clicks nav link "Browse"** → navigates to **Feed page**
14. **Clicks nav link "Leaderboard"** → navigates to **Leaderboard page**
15. **Clicks "+ Create"** → navigates to **Create Recipe wizard** (or Login if guest)

---

## Screen 3: Feed / Browse Page (Mobile)

### Design Prompt

> Design a mobile recipe browsing page for "zbite". Pinterest-style masonry grid for recipe discovery.
>
> **Top bar**: Search icon, "zbite" logo, cart and bell icons (if logged in).
>
> **Sticky filter bar** (stays fixed at top when scrolling, ~48px tall, white background, bottom border):
> - Left: Sort dropdown trigger showing current sort (e.g. "Trending") with down chevron. 
> - Vertical 1px separator line
> - Right: Horizontally scrollable row of category chips — "All" (active: primary fill + white text), "Italian", "Asian", "Vegan", "Quick Meals", "Seafood", "Greek", "Baking", "Desserts", "Healthy" (inactive: outline border + dark text). Hidden scrollbar. Subtle right-edge fade gradient hinting more chips exist.
>
> **Top Chefs row** (below filter bar, scrolls with content, ~80px tall):
> - Left: "Top Chefs" label with trophy icon (14px bold)
> - Right: "See all >" link
> - Below: 5 circular avatar photos (48px diameter) in a row with even spacing. #1 has gold border ring. Each has small rank badge (1-5) as overlay circle at bottom-right. Username below each (11px). Score below username (10px, gray).
>
> **Masonry grid** (2 columns, 12px gap):
> - Each card: food photo (natural aspect ratio, object-fit cover), difficulty badge bottom-left of image (green "Easy" / orange "Medium" / red "Hard", 10px uppercase, rounded), save heart icon top-right (32px white circle with heart outline, filled red when saved).
> - Below image (12px padding): Star rating "★ 4.5 (23)" (12px), recipe title (14px bold, 2-line clamp), author row (20px avatar + username 12px), meta row (clock icon + "30min" + dot + plate icon + "4 servings", 11px gray).
> - Card: white background, rounded 12px, soft shadow, break-inside avoid, 16px margin-bottom.
>
> **Bottom tab bar**: Home, Browse (active), Create, Activity, Profile.
>
> Infinite scroll — no "Load more" button, content loads automatically as user approaches bottom.

### User Flow

1. **User arrives at Feed** — sees FilterBar (sticky) + Top Chefs row + masonry recipe grid
2. **Taps sort dropdown** → option list opens: Following*, Trending, Recent, Top Rated, Quick (<30min). *Following only shown if logged in. Selecting an option reloads the grid with new sort.
3. **Taps a category chip** (e.g. "Italian") → chip fills with primary color, grid reloads showing only Italian recipes. Tapping "All" removes filter.
4. **Taps a chef avatar** in Top Chefs row → navigates to **Profile page** for that chef
5. **Taps "See all >"** on Top Chefs → navigates to **Leaderboard page**
6. **Taps a recipe card** → navigates to **Recipe Detail page**
7. **Taps save heart** on a card → if logged in: toggles saved state (outline ↔ filled red). If guest: redirects to **Login page**.
8. **Scrolls to bottom** → next page of recipes auto-loads. Loading indicator shows briefly.
9. **URL accepts pre-set sort**: arriving from Home "See all Trending >" opens Feed with "Trending" sort already selected

---

## Screen 4: Feed / Browse Page (Desktop)

### Design Prompt

> Design a desktop recipe browsing page for "zbite". 1400px max-width centered layout.
>
> **Top navbar**: Logo, Home, Browse (active), Leaderboard, search bar, Create button, bell, avatar.
>
> **Filter bar** (full width within container, not sticky on desktop):
> - Sort dropdown + vertical separator + category chips, all in one row.
>
> **Top Chefs row**: Same as mobile but wider spacing. 5 avatars (56px), more horizontal breathing room. "See all >" links to leaderboard.
>
> **Masonry grid**: 3 columns at 769px+, 4 columns at 1400px+. 20px gap. Cards wider with larger images. Same card info as mobile.
>
> Infinite scroll, generous whitespace, hover lift on cards.

### User Flow

Same as mobile Feed, plus:
10. **Hovers over recipe card** → card lifts with enhanced shadow
11. **Right side nav** accessible: Leaderboard link, Create button, etc.

---

## Screen 5: Choose Page — Step 1: Time (Mobile)

### Design Prompt

> Design a mobile page for choosing cooking time in a recipe decision flow. Minimal, focused, no distractions.
>
> **Top**: Left-aligned back arrow icon (←) with no label. No other top bar elements.
>
> **Center content** (vertically centered in available space):
> - Large heading: "How much time do you have?" (24px bold, dark text)
> - 16px spacing
> - 4 full-width pill buttons stacked vertically with 12px gap:
>   - "⏱ 15 min or less"
>   - "⏱ 30 min or less"
>   - "⏱ 60 min or less"
>   - "♾️ Any time"
> - Each pill: 56px tall, rounded rectangle (28px radius), outline border (1.5px, gray), centered text (16px), clock emoji left of text
> - Hover/tap state: fill with primary color, white text
>
> **Bottom area**: Progress text "Step 1 of 2" (12px, gray, centered) with two dots (first dot: primary color filled, second dot: gray outline).
>
> **Bottom tab bar**: Home, Browse, Create, Activity, Profile.
>
> White/cream background. Focused, calm, no unnecessary elements. The page should feel like a quick decision — not a form.

### User Flow

1. **User arrives from Home** ("Help Me Choose" button) — sees time question
2. **Taps a time pill** (e.g. "30 min or less") → pill briefly fills with primary color as feedback → page animates/slides to **Step 2: Mood**
3. **Taps back arrow (←)** → navigates back to **Home page**
4. **Taps any bottom tab** → navigates to that tab's page (leaves Choose flow)

**Desktop**: Same content but centered in a ~500px max-width container. Back arrow in same position. Clean, focused.

---

## Screen 6: Choose Page — Step 2: Mood (Mobile)

### Design Prompt

> Design a mobile page for choosing a food mood. Same visual style as Step 1 (time selection).
>
> **Top**: Left-aligned back arrow (←).
>
> **Center content**:
> - Large heading: "What are you in the mood for?" (24px bold)
> - 5 full-width pill buttons stacked vertically with 12px gap:
>   - "💪 High Protein"
>   - "🍝 Comfort Food"
>   - "🥗 Light & Fresh"
>   - "⚡ Quick & Easy"
>   - "🎲 Surprise Me"
> - Same pill styling as Step 1 (56px tall, outline, rounded)
>
> **Bottom area**: "Step 2 of 2" with two filled dots (both primary color).
>
> **Bottom tab bar**.

### User Flow

1. **User arrives from Step 1** — sees mood question with their time choice remembered
2. **Taps a mood pill** (e.g. "Light & Fresh") → navigates to **Results page** with both filters applied (e.g. maxTime=30 + mood=light)
3. **Taps "Surprise Me" pill** → navigates to **Results page** with only the time filter (random mood)
4. **Taps back arrow (←)** → goes back to **Step 1: Time** (time selection preserved)

**Desktop**: Same ~500px centered container.

---

## Screen 7: Results Page (Mobile)

### Design Prompt

> Design a mobile recipe results page showing 3 recommended recipes. This is the payoff screen of the decision engine — cards should feel premium and large.
>
> **Top**: Left side: "← Start over" as a text link (14px, primary color, with left arrow).
>
> **Header section** (24px padding):
> - Heading: "Here's what we found" (22px bold)
> - Below heading: small filter summary chips (inline, 12px, rounded pill, light background). Example: "🥗 Light & Fresh" chip + "⏱ 30 min" chip
>
> **3 large recipe cards** stacked vertically with 16px gap between:
> Each card (full-width, white bg, rounded 16px, soft shadow):
> - Large food image (16:9 aspect ratio, fills card width, rounded top corners)
> - Content area (16px padding):
>   - Recipe title (18px bold, dark, 2-line clamp)
>   - Info row: "★ 4.7 (45)" rating + "25 min" with clock icon (14px)
>   - Tags row: Difficulty badge (green "Easy" / orange "Medium" / red "Hard", small rounded pill) + category tag ("Italian", outline pill)
>   - Author row: 24px circular avatar + "@chefname" (13px, gray)
> - Entire card is tappable (cursor pointer)
>
> **After the 3 cards**: Full-width outline button "🔄 Show me 3 more" (48px tall, rounded, center-aligned text, primary color border + text). 16px margin above.
>
> **Bottom tab bar**.
>
> Feel: premium, decisive, "here are your 3 best options." Cards should be large enough that each recipe gets real visual attention — not cramped.

### User Flow

1. **User arrives from Choose (Step 2)** — sees 3 recipe recommendations with filter summary chips
2. **Taps a recipe card** → navigates to **Recipe Detail page**
3. **Taps "Show me 3 more"** → 3 new cards append below the existing ones (page grows, user can scroll). The button moves below the new cards. Can repeat multiple times.
4. **Taps "← Start over"** → navigates back to **Choose page (Step 1)**
5. **If no recipes match filters** → shows empty state: illustration/icon, "No recipes match those filters", "Try different options!" text, "Start over" button
6. **While loading** → 3 skeleton cards matching ResultCard shape (shimmer animation)

---

## Screen 8: Results Page (Desktop)

### Design Prompt

> Design a desktop recipe results page. Max-width 1000px centered.
>
> **Top left**: "← Start over" text link.
>
> **Header**: "Here's what we found" (28px bold) + filter chips inline.
>
> **3 cards in a horizontal row** (equal width, ~300px each, 24px gap):
> Each card: large food image (3:4 aspect), title, rating, time, difficulty badge, category tag, author avatar + name. White bg, rounded 16px, soft shadow. Hover: translateY(-4px) + deeper shadow.
>
> **Below row**: "🔄 Show me 3 more" button centered. Clicking adds a new row of 3 below.
>
> Clean, spacious layout. Cards feel premium.

### User Flow

Same as mobile Results, plus:
7. **"Show me 3 more"** adds a new horizontal row of 3 below the previous ones
8. **Hover on card** → subtle lift animation

---

## Screen 9: Leaderboard Page (Mobile)

### Design Prompt

> Design a mobile leaderboard page showing top chefs ranked by engagement score. Celebratory, gamified feel.
>
> **Top bar**: Search icon, "zbite" logo.
>
> **Header**: "Top Chefs" (24px bold) with trophy emoji. Centered.
>
> **Period tabs** (centered row, 8px gap):
> 3 pill-style tabs: "Weekly" | "Monthly" | "All Time"
> Active: primary color fill + white text (20px horizontal padding, 8px vertical, 20px border-radius)
> Inactive: transparent + border + dark text
>
> **Podium section** (centered, ~200px tall):
> - Center: #1 — 100px avatar with 4px gold (#FFD700) border ring, small crown icon above, name below (16px bold), score "1,250 pts" (14px), "View" outline button
> - Left: #2 — 70px avatar with silver (#C0C0C0) border, "2" badge, name, score
> - Right: #3 — 70px avatar with bronze (#CD7F32) border, "3" badge, name, score
> - Staggered heights: #1 higher than #2 and #3 (like an actual podium)
>
> **Table section** (rank 4+, list below podium):
> Each row (~56px tall, border-bottom 1px light gray):
> - Rank number (16px bold, 32px width, right-aligned, gray)
> - Avatar (40px circle)
> - Name (14px bold, flex: 1) + optional bio (12px gray, single-line ellipsis below name)
> - Score (14px bold, right-aligned, 80px width)
> - "Follow" button (small outline pill, 28px tall): "Follow" or "Following" (filled when following)
>
> **Bottom tab bar**.
>
> Gold/warm accents on the podium. Rest of page is clean and list-like.

### User Flow

1. **User arrives** — sees podium (top 3) + period tabs defaulting to "All Time"
2. **Taps a period tab** (e.g. "Weekly") → tab becomes active, leaderboard reloads with weekly rankings
3. **Taps a podium avatar or "View" button** → navigates to that chef's **Profile page**
4. **Taps an avatar in table rows** → navigates to that chef's **Profile page**
5. **Taps "Follow" button** → if logged in: toggles follow state (button changes to "Following" with filled style). If guest: redirects to **Login page**.
6. **Scrolls down** → more rows load if available
7. **Arrived from Feed "See all >"** → same page, no special state

---

## Screen 10: Recipe Detail Page (Mobile)

### Design Prompt

> Design a mobile recipe detail page. Rich content, long scrollable page, food-focused.
>
> **Cover image**: Full-width, 56% of viewport height, object-fit cover, no top bar overlay (image bleeds to edges). Optional: subtle gradient overlay at bottom for readability.
>
> **Title section** (16px padding):
> - Recipe title (24px bold, dark)
> - Row: Difficulty badge (rounded pill, colored) + "30 min" with clock icon + "★ 4.7 (45)" star rating — all 13px
>
> **Author row** (16px padding, flex row):
> - 36px circular avatar + username (14px bold) on left
> - "Follow" outline button on right (hidden if viewing own recipe)
>
> **Action bar** (horizontal row, evenly spaced, 48px tall, border-top + border-bottom):
> - Heart icon (outline/filled) + like count below
> - Comment bubble icon
> - Share/forward arrow icon
> - Bookmark/save icon (outline/filled)
> All icons 24px, gray by default, primary color when active (liked/saved)
>
> **Content sections** (each with 16px horizontal padding, 24px vertical gap between sections):
> 1. **Description** — paragraph text (14px, gray, optional)
> 2. **Rating input** — "How was this recipe?" label + 5 tappable star icons (32px each, gold filled for rated stars)
> 3. **Nutrition** — 4 inline circular badges: Calories (red), Protein (blue), Carbs (green), Fat (yellow) — each 64px circle with value + unit inside, label below
> 4. **Servings adjuster** — "Servings" label + "−" circle button + number + "+" circle button
> 5. **Ingredients list** — numbered list, each line: "2 cups flour" format, scales with servings
> 6. **"Add to Shopping List"** — full-width outline button with cart icon
> 7. **Recipe steps** — numbered cards, each: step number circle + title (bold) + instruction text + optional step image (rounded, inline)
> 8. **Comments** — "Comments (12)" header + text input + list of comments (avatar + name + time ago + text)
>
> **Sticky bottom bar**: Full-width filled primary button "Start Cooking" with chef hat icon. 56px tall. Tapping enters Cook Mode.

### User Flow

1. **User arrives** (from Feed, Results, Search, or direct link) — sees cover image + recipe info
2. **Taps heart icon** → if logged in: toggles like (fills red, count increments). If guest: redirects to **Login page**
3. **Taps bookmark icon** → if logged in: toggles save. If guest: redirects to **Login page**
4. **Taps comment bubble** → scrolls down to comments section
5. **Taps share icon** → native share sheet (or copies link to clipboard)
6. **Taps "Follow" button** → if logged in: toggles follow state. If guest: redirects to **Login page**
7. **Taps rating stars** → if logged in: submits rating (stars fill up to tapped star). If guest: redirects to **Login page**
8. **Taps +/- on servings** → ingredient quantities recalculate proportionally
9. **Taps "Add to Shopping List"** → if logged in: adds all ingredients, shows success toast. If guest: redirects to **Login page**
10. **Types in comment input + submits** → if logged in: comment appears at top of list. If guest: redirects to **Login page**
11. **Taps "Start Cooking"** → enters full-screen **Cook Mode** (immersive step-by-step, one step at a time, large text, prev/next buttons, progress bar)
12. **Taps author avatar/name** → navigates to **Profile page** for that chef

---

## Screen 11: Search Page (Mobile)

### Design Prompt

> Design a mobile search page with tabs for recipes and chefs.
>
> **Top**: Sticky search input bar (full-width, auto-focused, rounded, magnifying glass icon left, "Search recipes & chefs..." placeholder). "Cancel" text button right of input.
>
> **Tabs** (below search bar): "Recipes" | "Chefs" — underline-style tabs. Active: primary color text + bottom border.
>
> **Recipes tab content**: Masonry grid (2 columns) of recipe cards — same ExploreCard design as Feed page. Infinite scroll.
>
> **Chefs tab content**: Vertical list of user cards. Each: 48px avatar + "@username" (bold) + bio (gray, 1-line ellipsis). Tap → Profile page.
>
> **Empty state**: "No recipes found for "query"" or "No chefs found for "query"" — centered text with search icon.
>
> **Bottom tab bar**.

### User Flow

1. **User arrives** (from search icon in top bar) — search input is auto-focused, keyboard opens
2. **Types query** (min 2 characters) → results load below in active tab
3. **Taps "Recipes" tab** → shows recipe grid matching query
4. **Taps "Chefs" tab** → shows chef list matching query
5. **Taps a recipe card** → navigates to **Recipe Detail page**
6. **Taps a chef card** → navigates to **Profile page**
7. **Taps "Cancel"** → navigates back to previous page

---

## Screen 12: Profile Page (Mobile)

### Design Prompt

> Design a mobile user profile page.
>
> **Top bar**: Back arrow (←) + "zbite" logo.
>
> **Profile header** (centered, 24px padding):
> - 80px circular avatar (centered)
> - "@username" (18px bold, below avatar)
> - Bio text (14px, gray, centered, max 2 lines)
> - Stats row (3 columns, evenly spaced):
>   - Recipes count (number bold + "Recipes" label below, 12px)
>   - Followers count (tappable → Followers list page)
>   - Following count (tappable → Following list page)
> - Button below stats:
>   - If own profile: "Edit Profile" outline button
>   - If other's profile: "Follow" / "Following" toggle button
>
> **Content tabs**: "Recipes" | "Saved" (Saved only visible on own profile). Underline-style.
>
> **Tab content**: Masonry grid (2 columns) of recipe cover images. Tap image → Recipe Detail page.
>
> **Empty state**: "No recipes yet" centered text.
>
> **Bottom tab bar**.

### User Flow

1. **User arrives** (from Feed card author, Leaderboard, Search, or direct link) — sees profile info + recipe grid
2. **Taps "Followers" count** → navigates to **Followers list page**
3. **Taps "Following" count** → navigates to **Following list page**
4. **Taps "Follow" button** → toggles follow (requires login)
5. **Taps "Edit Profile"** (own profile) → opens edit modal (change avatar + bio)
6. **Taps "Recipes" tab** → shows user's published recipes
7. **Taps "Saved" tab** (own profile only) → shows recipes user has saved
8. **Taps a recipe image** → navigates to **Recipe Detail page**

---

## Flow Summary: Complete User Journey Map

```
                                    ┌─────────────────┐
                                    │   HOME PAGE (/)  │
                                    │                  │
                                    │  "Help Me Choose"├────► CHOOSE Step 1 ──► CHOOSE Step 2 ──┐
                                    │  "Surprise Me"   ├─────────────────────────────────────────┤
                                    │                  │                                         ▼
                                    │  Trending row    │                                  RESULTS PAGE
                                    │  Top Rated row   │                                  (3 cards)
                                    │  Quick Wins row  │                                      │
                                    │    ↓ See all     │                                      │
                                    └──┬───────────────┘                               ┌──────┘
                                       │                                               ▼
                                       ▼                                        RECIPE DETAIL
                                  FEED / BROWSE                                  (/recipe/:id)
                                  (/feed)                                            │
                                       │                                             │
                                       ├── Top Chefs row ──► LEADERBOARD             ▼
                                       │                     (/leaderboard)     COOK MODE
                                       │                          │           (full-screen)
                                       ▼                          ▼
                                  Recipe Cards ──────────► PROFILE (/user/:id)
                                                                  │
                                                                  ▼
                                                           FOLLOW / LIKE / SAVE
                                                           (requires login)
                                                                  │
                                                           ┌──────┴──────┐
                                                           ▼             ▼
                                                        LOGIN      REGISTER
                                                       (/login)   (/register)
                                                                      │
                                                               Onboarding (4 steps)
                                                                      │
                                                                      ▼
                                                                 FEED (/feed)
```
