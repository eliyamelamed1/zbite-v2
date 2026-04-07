# zbite - Design Brief for UI Designer

## What is zbite?
A social media recipe-sharing platform where users discover, cook, save, and share recipes. Think **Instagram meets AllRecipes** — visual-first, scroll-addictive, but genuinely useful for cooking.

---

## Brand & Mood

### Personality
- Warm, inviting, appetite-inducing
- Modern but not cold — feels like a cozy kitchen, not a tech app
- Playful micro-interactions that reward engagement

### Color Palette
- **Primary**: `#E85D2C` (warm orange-red) — CTAs, active states
- **Primary Hover**: `#D14D1E`
- **Secondary/Accent**: `#F5A623` (amber/golden) — stars, highlights, badges
- **Background**: `#FFF8F0` (warm cream)
- **Cards**: `#FFFFFF`
- **Text**: `#2D1810` (dark warm brown)
- **Text Muted**: `#7A6558`
- **Border**: `#F0E0D0`
- **Difficulty Easy**: `#4CAF50` green
- **Difficulty Medium**: `#F5A623` amber
- **Difficulty Hard**: `#E85D2C` red

### Typography
- **Headings**: Playfair Display (serif) — elegant food-magazine feel
- **Body**: Inter (sans-serif) — clean readability
- **Logo "zbite"**: Playfair Display, bold, in primary orange

### Design Tokens
- Card radius: 12px
- Button radius: 12px
- Avatar radius: 50% (circle)
- Card shadow: `0 2px 8px rgba(45, 24, 16, 0.08)`
- Hover shadow: `0 8px 24px rgba(45, 24, 16, 0.12)`

---

## Platforms & Breakpoints

| Breakpoint | Name | Layout |
|-----------|------|--------|
| < 768px | Mobile | Single column, bottom tab bar, full-width cards |
| 768-1024px | Tablet | 2-column grid, sidebar navigation |
| > 1024px | Desktop | 3-column grid, full top navbar |

**Mobile-first design** — the phone experience should feel native-app quality.

---

## Navigation

### Mobile (bottom tab bar, always visible)
```
┌─────────────────────────────────────────┐
│  [Home]  [Explore]  [+]  [Activity]  [Profile] │
│   🏠       🔍      ➕      🔔        👤       │
└─────────────────────────────────────────┘
```
- **Home** = Following feed (recipes from people you follow)
- **Explore** = Discover feed (trending, recent, categories)
- **+** = Create recipe (center button, larger, primary orange circle)
- **Activity** = Notifications (new followers, likes on your recipes, comments)
- **Profile** = Your profile

The "+" button should be elevated/floating above the tab bar — it's the most important action.

### Desktop (top navbar)
```
┌──────────────────────────────────────────────────────────────────┐
│  zbite          [🔍 Search...]     Home | Explore | + Create    🔔  [Avatar ▾] │
└──────────────────────────────────────────────────────────────────┘
```

---

## Pages & Screens

---

### 1. SPLASH / ONBOARDING (guest only)

**Purpose**: Convert visitors to sign-ups. Show the value immediately.

**Mobile layout**:
```
┌─────────────────────────┐
│                         │
│   [Full-bleed food      │
│    photo with dark      │
│    gradient overlay]    │
│                         │
│   zbite                 │
│   "Cook. Share. Inspire"│
│                         │
│   [ Get Started ]       │  ← primary orange, full-width rounded
│   [ I have an account ] │  ← text link below
│                         │
│   ── or browse ──       │
│   [ Explore Recipes → ] │  ← ghost button
│                         │
└─────────────────────────┘
```

**Desktop**: Split layout — left side is a hero food photo collage with parallax, right side has the signup form directly visible. No separate login page needed on desktop — the form is right there.

---

### 2. SIGN UP / LOG IN

**Mobile**: Full-screen forms, one field visible at a time (step-by-step for signup).

**Sign Up steps** (mobile):
- Step 1: "What should we call you?" → username input
- Step 2: "Your email" → email input
- Step 3: "Create a password" → password input
- Step 4: "Pick your interests" → tap food category chips (Italian, Asian, Desserts, Vegan, Quick Meals, etc.) — this seeds the explore algorithm
- Progress bar at top showing steps 1-4

**Login**: Simple single card — email + password + "Log in" button + "Forgot password?" link

**Desktop**: Centered card (max 420px), same warm cream background.

---

### 3. HOME FEED (Following Feed) — `/`

**Purpose**: The default logged-in screen. Shows recipes from people you follow. This is the "scroll loop" — the addictive core.

**Mobile layout**:
```
┌─────────────────────────┐
│  zbite        🔔  💬    │  ← sticky top bar, minimal
├─────────────────────────┤
│                         │
│  ┌─────────────────────┐│
│  │  [Author avatar]    ││
│  │  @chefmario · 2h    ││  ← author row with time ago
│  │─────────────────────││
│  │                     ││
│  │   [FULL-WIDTH       ││
│  │    RECIPE PHOTO]    ││  ← 4:5 ratio (Instagram-style)
│  │                     ││
│  │─────────────────────││
│  │  ❤️ 💬 🔖    ★4.5  ││  ← action bar: like, comment, save, rating
│  │  245 likes          ││
│  │  Spaghetti Carbonara││  ← title (bold)
│  │  The perfect creamy ││  ← description (2 lines max, "...more")
│  │  ⏱30min · 🟢Easy   ││  ← meta chips
│  │  View full recipe → ││  ← link to detail
│  └─────────────────────┘│
│                         │
│  ┌─────────────────────┐│
│  │  [Next recipe card] ││
│  │  ...                ││
│  └─────────────────────┘│
│                         │
│  ── You're all caught up ── │  ← end of feed message
│  "Follow more chefs to      │
│   fill your feed"           │
│  [ Explore → ]              │
│                         │
├─────────────────────────┤
│  🏠  🔍  ➕  🔔  👤    │
└─────────────────────────┘
```

**Key interactions**:
- **Double-tap photo to like** — heart animation pops up on the image (like Instagram)
- **Pull-to-refresh** at top
- **Infinite scroll** — no "Load More" button, just smooth loading
- Tap bookmark icon to save — icon fills with animation
- Swipe left on card to see quick nutrition info overlay

**Desktop**:
- Single-column centered feed (max 600px, like Instagram desktop)
- Sidebar on right: "Suggested chefs to follow" + "Trending recipes"

**Empty state** (following nobody):
```
┌─────────────────────────┐
│                         │
│   [Illustration: empty  │
│    plate with fork]     │
│                         │
│   "Your feed is empty"  │
│   "Follow some chefs    │
│    to see what they're  │
│    cooking"             │
│                         │
│   [ Find people to     │
│     follow → ]          │
│                         │
│   ── Suggested for you ──│
│   [UserCard] [Follow]   │
│   [UserCard] [Follow]   │
│   [UserCard] [Follow]   │
│                         │
└─────────────────────────┘
```

---

### 4. EXPLORE PAGE — `/explore`

**Purpose**: Discover new recipes and users. The "infinite discovery" loop.

**Mobile layout**:
```
┌─────────────────────────┐
│  Explore       [🔍]     │
├─────────────────────────┤
│                         │
│  ── Categories (horizontal scroll) ──
│  [🍝All] [🍕Italian] [🍣Asian] [🍰Desserts] [🥗Healthy] [⚡Quick]
│                         │
│  ── Trending Now ──     │
│  ┌──────┐ ┌──────┐     │  ← 2-column masonry grid
│  │      │ │      │     │
│  │ img  │ │ img  │     │  (varying heights like Pinterest)
│  │      │ │      │     │
│  │Title │ │Title │     │
│  │★4.5  │ │★3.8  │     │
│  └──────┘ └──────┘     │
│  ┌──────┐ ┌──────┐     │
│  │      │ │      │     │
│  │ img  │ │ img  │     │
│  │Title │ │Title │     │
│  │★4.2  │ │★5.0  │     │
│  └──────┘ └──────┘     │
│  ... infinite scroll    │
│                         │
├─────────────────────────┤
│  🏠  🔍  ➕  🔔  👤    │
└─────────────────────────┘
```

**Search** (tap the search icon or search bar):
```
┌─────────────────────────┐
│  [← ] [Search recipes, users...] │
├─────────────────────────┤
│  Recent searches:       │
│  🕐 carbonara           │
│  🕐 @chefanna           │
│  🕐 vegan desserts      │
│                         │
│  ── Trending searches ──│
│  🔥 meal prep           │
│  🔥 air fryer recipes   │
│  🔥 chocolate cake      │
├─────────────────────────┤
│  (after typing)         │
│                         │
│  ── Users ──            │
│  [Avatar] @chefmario    │
│  [Avatar] @chefanna     │
│  See all users →        │
│                         │
│  ── Recipes ──          │
│  [Thumbnail] Carbonara  │
│  [Thumbnail] Pasta Bake │
│  See all recipes →      │
└─────────────────────────┘
```

**Desktop**: 3-column masonry grid, search bar always visible in navbar, category tabs as horizontal pills below navbar.

**Sort/filter tabs** at top: `Trending` | `Recent` | `Top Rated` | `Quick (<30min)`

---

### 5. RECIPE DETAIL PAGE — `/recipe/:id`

**Purpose**: The full recipe view. Must be beautiful AND functional for cooking.

**Mobile layout**:
```
┌─────────────────────────┐
│  [← Back]    [⋯ More]   │  ← transparent over image
├─────────────────────────┤
│                         │
│  [FULL-WIDTH COVER      │
│   IMAGE — hero, 60vh    │
│   with gradient at      │
│   bottom]               │
│                         │
│  ┌─────────────────────┐│
│  │ Spaghetti Carbonara ││  ← title overlaid on gradient
│  │ by @chefmario       ││
│  └─────────────────────┘│
│                         │
│  ── Action Bar ──       │
│  ❤️ 245  💬 18  🔖  ⬆️ │  ← like, comment, save, share
│                         │
│  ── Quick Info Bar ──   │
│  ┌──────┬──────┬──────┐ │
│  │⏱     │🔥    │🍽    │ │
│  │30min │Easy  │4 srv │ │
│  └──────┴──────┴──────┘ │
│                         │
│  ── Rate This ──        │
│  ★ ★ ★ ★ ★  (4.5 avg)  │  ← interactive stars
│                         │
│  ── Nutrition ──        │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐
│  │450 │ │25g │ │50g │ │18g │
│  │cal │ │pro │ │carb│ │fat │
│  └────┘ └────┘ └────┘ └────┘
│                         │
│  ── Ingredients ──      │
│  [ ] 400g spaghetti     │  ← checkboxes! tap to check off
│  [ ] 200g guanciale     │    while cooking
│  [ ] 4 egg yolks        │
│  [ ] 100g pecorino      │
│  [ ] Black pepper       │
│                         │
│  ── Steps ──            │
│  ┌─────────────────────┐│
│  │ ① Boil pasta in     ││
│  │   salted water      ││
│  │   [Step photo]      ││
│  │                     ││
│  │ ② Cook guanciale    ││
│  │   until crispy      ││
│  │   [Step photo]      ││
│  │                     ││
│  │ ③ Mix egg yolks     ││
│  │   with pecorino...  ││
│  └─────────────────────┘│
│                         │
│  ── Comments ──         │
│  @anna: "Made this last │
│  night, incredible!"    │
│  @bob: "Best carbonara" │
│  View all 18 comments → │
│  [Write a comment...]   │
│                         │
│  ── More from @chefmario│
│  [Card] [Card] [Card]   │  ← horizontal scroll
│                         │
└─────────────────────────┘
```

**"Cook Mode" button** (floating at bottom):
```
┌─────────────────────────┐
│  [ 👨‍🍳 Start Cooking ]   │  ← sticky bottom bar, orange
└─────────────────────────┘
```
When tapped, enters **Cook Mode**:
- Screen stays awake (wake lock)
- Step-by-step view — one step at a time, large text
- Swipe left/right between steps
- Big "Next Step" button
- Voice-friendly large text (hands might be messy)
- Timer button per step if time is mentioned
- Progress bar at top (step 2 of 6)

**"More" menu (⋯)**:
- Edit recipe (if owner)
- Share recipe
- Report recipe
- Delete recipe (if owner, with confirmation)

**Desktop**: Two-column layout — left: cover image + ingredients sidebar (sticky), right: steps + comments. Cook mode opens as a focused overlay.

---

### 6. CREATE/EDIT RECIPE — `/recipe/new`

**Purpose**: Make recipe creation feel easy, not like filling out a form.

**Mobile layout** — wizard/step-by-step approach:

**Step 1: The Hook**
```
┌─────────────────────────┐
│  [× Cancel]  Step 1/5   │
│  ━━━━━━━━━━░░░░░░░░░░░  │  ← progress bar
├─────────────────────────┤
│                         │
│  "Start with a photo"   │
│                         │
│  ┌─────────────────────┐│
│  │                     ││
│  │  [📷 Take Photo]    ││  ← big tap target
│  │  [🖼 Choose from    ││
│  │     gallery]        ││
│  │                     ││
│  └─────────────────────┘│
│                         │
│  (after photo selected, │
│   show preview with     │
│   crop/filter options)  │
│                         │
│         [ Next → ]      │
└─────────────────────────┘
```

**Step 2: The Basics**
```
┌─────────────────────────┐
│  [← Back]   Step 2/5    │
│  ━━━━━━━━━━━━━━░░░░░░░  │
├─────────────────────────┤
│                         │
│  Title                  │
│  [What did you make?  ] │
│                         │
│  Description            │
│  [Tell us about it...] │
│                         │
│  Difficulty             │
│  (🟢Easy) (🟡Medium) (🔴Hard)│
│                         │
│  ⏱ Cooking time         │
│  [__] minutes           │
│                         │
│  🍽 Servings            │
│  [ - ]  4  [ + ]        │  ← stepper, not text input
│                         │
│         [ Next → ]      │
└─────────────────────────┘
```

**Step 3: Ingredients**
```
┌─────────────────────────┐
│  [← Back]   Step 3/5    │
│  ━━━━━━━━━━━━━━━━━━░░░  │
├─────────────────────────┤
│                         │
│  "What goes in it?"     │
│                         │
│  ┌─────────────────────┐│
│  │ 400g   spaghetti [×]││
│  │ 200g   guanciale  [×]││
│  │ 4      egg yolks  [×]││
│  │ [+] Add ingredient  ││
│  └─────────────────────┘│
│                         │
│  (drag to reorder)      │
│                         │
│         [ Next → ]      │
└─────────────────────────┘
```

**Step 4: Steps**
```
┌─────────────────────────┐
│  [← Back]   Step 4/5    │
│  ━━━━━━━━━━━━━━━━━━━━━░ │
├─────────────────────────┤
│                         │
│  "How do you make it?"  │
│                         │
│  Step 1                 │
│  [Describe this step..] │
│  [📷 Add photo]        │
│                         │
│  Step 2                 │
│  [Describe this step..] │
│  [📷 Add photo]        │
│                         │
│  [+ Add Step]           │
│                         │
│         [ Next → ]      │
└─────────────────────────┘
```

**Step 5: Nutrition (optional)**
```
┌─────────────────────────┐
│  [← Back]   Step 5/5    │
│  ━━━━━━━━━━━━━━━━━━━━━━ │
├─────────────────────────┤
│                         │
│  "Nutrition info"       │
│  (optional)             │
│                         │
│  Calories [____]        │
│  Protein  [____] g      │
│  Carbs    [____] g      │
│  Fat      [____] g      │
│                         │
│  [ 🎉 Publish Recipe ]  │  ← celebration button
│                         │
└─────────────────────────┘
```

After publishing → confetti animation → redirect to the new recipe.

**Desktop**: All steps visible in one scrollable form (same as current), with a live preview panel on the right showing what the recipe will look like.

---

### 7. USER PROFILE — `/user/:id`

**Mobile layout**:
```
┌─────────────────────────┐
│  [← Back]  @chefmario   │
├─────────────────────────┤
│                         │
│       [Avatar 80px]     │
│       @chefmario        │
│  "Passionate home cook  │
│   from Italy 🇮🇹"       │
│                         │
│  ┌───────┬──────┬──────┐│
│  │  24   │  125 │  48  ││  ← tappable stat blocks
│  │recipes│followers│following││
│  └───────┴──────┴──────┘│
│                         │
│  [ Follow ]  [ Message ]│  ← or [Edit Profile] if own
│                         │
│  ── Tab bar ──          │
│  [🍽 Recipes] [🔖 Saved]│  ← Saved only visible on own
│                         │
│  ┌──────┐ ┌──────┐     │
│  │      │ │      │     │  ← 2-column grid of recipe
│  │ img  │ │ img  │     │    thumbnails (like Instagram
│  │      │ │      │     │    profile grid)
│  └──────┘ └──────┘     │
│  ┌──────┐ ┌──────┐     │
│  │ img  │ │ img  │     │
│  └──────┘ └──────┘     │
│                         │
├─────────────────────────┤
│  🏠  🔍  ➕  🔔  👤    │
└─────────────────────────┘
```

**Tapping followers/following count** opens a bottom sheet (mobile) or modal (desktop) with a scrollable list of UserCards with follow/unfollow buttons.

**Edit Profile** (bottom sheet on mobile):
- Change avatar (camera/gallery)
- Edit bio (textarea)
- Save button

**Desktop**: Profile header centered at top, 3-column recipe grid below. Same layout as Instagram desktop profiles.

---

### 8. ACTIVITY / NOTIFICATIONS — `/activity`

**Mobile layout**:
```
┌─────────────────────────┐
│  Activity               │
├─────────────────────────┤
│  ── Today ──            │
│  [av] @anna liked your  │
│       Carbonara · 2m    │
│                         │
│  [av] @bob started      │
│       following you · 1h│
│                         │
│  [av] @chef rated your  │
│       Pizza ★★★★★ · 3h │
│                         │
│  ── This Week ──        │
│  [av] @maria saved your │
│       Tiramisu · 2d     │
│                         │
│  [av] 5 people liked    │
│       your Pasta · 3d   │
│                         │
├─────────────────────────┤
│  🏠  🔍  ➕  🔔  👤    │
└─────────────────────────┘
```

**Desktop**: Dropdown from bell icon in navbar (like Twitter/X notifications dropdown).

---

## Addictive / Engagement Patterns

### 1. Double-tap to like
- Tap the recipe photo twice → big heart animation pulses on the image
- Haptic feedback on mobile

### 2. Infinite scroll
- No pagination buttons anywhere — just smooth infinite loading
- Skeleton loading cards (gray shimmer) while fetching

### 3. Pull-to-refresh
- Custom animation: a small fork/spoon icon pulls down and spins

### 4. Save animation
- Bookmark icon: outline → filled with a satisfying "pop" scale animation
- Brief toast: "Saved to your collection"

### 5. Rating animation
- Stars fill up left-to-right with a gold sweep animation
- Show "Thanks for rating!" micro-toast

### 6. Follow suggestions
- After following someone, show "People also follow..." card
- "Suggested for you" section interspersed in the feed every ~10 posts

### 7. Streak / engagement hooks (future)
- "You've cooked 3 recipes this week!" badge
- Weekly cooking challenges
- "Recipe of the Day" featured card at top of explore

### 8. Social proof everywhere
- "245 people saved this"
- "Trending in Italian"
- "Popular this week"
- "@friend and 3 others liked this"

### 9. Skeleton loading screens
- Every page shows skeleton placeholders (shimmering gray blocks) instead of spinners
- Makes the app feel faster

### 10. Smooth transitions
- Page transitions: slide in from right (forward), slide out to right (back)
- Cards: fade-in stagger as they enter viewport
- Images: blur-up loading (low-res placeholder → sharp)

---

## Component Library Summary

| Component | Description |
|-----------|------------|
| **RecipeCard** | Cover image, title, author, rating, meta. Used in feeds and grids |
| **RecipeFeedCard** | Full-width card for home feed with action bar (like, comment, save) |
| **UserCard** | Avatar + username + bio + follow button. Horizontal layout |
| **UserChip** | Small avatar + username inline. Used in "liked by @user" |
| **StarRating** | Interactive 1-5 stars with hover/tap state |
| **DifficultyBadge** | Colored pill (green/amber/red) with text |
| **CategoryChip** | Rounded pill for food categories, toggleable |
| **ActionBar** | Like + Comment + Save + Share icon row |
| **BottomTabBar** | Mobile navigation with 5 tabs + floating create button |
| **TopNavbar** | Desktop navigation with logo, search, links, avatar |
| **SearchBar** | Expandable search with recent/trending suggestions |
| **BottomSheet** | Mobile modal that slides up from bottom (followers list, edit profile, etc.) |
| **SkeletonCard** | Gray shimmer placeholder matching RecipeCard shape |
| **ImageUpload** | Drop zone with camera/gallery options, preview, crop |
| **StepCard** | Numbered step with instruction text + optional image |
| **NutritionBar** | 4 boxes showing cal/protein/carbs/fat |
| **EmptyState** | Illustration + title + subtitle + CTA button |
| **Toast** | Brief notification pop-up (bottom of screen on mobile) |
| **CookMode** | Full-screen step-by-step overlay with large text + navigation |

---

## Screen List (all unique screens to design)

### Auth
1. Splash / Landing (mobile)
2. Landing (desktop — with inline signup form)
3. Sign Up — Step 1: Username
4. Sign Up — Step 2: Email
5. Sign Up — Step 3: Password
6. Sign Up — Step 4: Pick interests
7. Log In

### Core
8. Home Feed (following) — with content
9. Home Feed — empty state (no follows)
10. Explore — grid view with categories
11. Explore — search active (with suggestions)
12. Explore — search results

### Recipe
13. Recipe Detail — full view
14. Recipe Detail — Cook Mode (step-by-step)
15. Create Recipe — Step 1: Photo
16. Create Recipe — Step 2: Basics
17. Create Recipe — Step 3: Ingredients
18. Create Recipe — Step 4: Steps
19. Create Recipe — Step 5: Nutrition
20. Create Recipe — Success/Published

### Profile
21. User Profile — other user
22. User Profile — own profile
23. Edit Profile (bottom sheet / modal)
24. Followers/Following list (bottom sheet / modal)

### Other
25. Activity/Notifications
26. Settings page
27. 404 / Not Found

**Total: 27 screens** (design both mobile 375px and desktop 1280px for each)

---

## Micro-interactions to Design

1. **Heart pop** — double-tap like animation on recipe image
2. **Bookmark fill** — save icon outline → solid with scale bounce
3. **Star sweep** — rating stars fill gold left-to-right
4. **Pull-to-refresh** — custom fork/spoon spinner
5. **Skeleton shimmer** — loading placeholder pulse
6. **Confetti burst** — after publishing a recipe
7. **Follow button** — "Follow" → "Following" with checkmark morph
8. **Tab bar active** — icon fills + label appears with spring animation
9. **Image blur-up** — low-res placeholder fades into sharp image
10. **Toast slide-in** — notification slides up from bottom, auto-dismisses

---

## Key Design Principles

1. **Food is the hero** — images should be BIG and beautiful. Minimize UI chrome around photos.
2. **One-thumb reachable** — all primary actions within thumb zone on mobile.
3. **Useful while cooking** — Cook Mode with large text, keep-screen-awake, checkable ingredients.
4. **Social proof drives engagement** — show likes, saves, ratings prominently.
5. **Reduce friction to post** — wizard-style creation, photo first (most fun part).
6. **Instant feedback** — every tap has a visual response (animation, color change, haptic).
