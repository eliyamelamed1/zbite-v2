# zbite — Figma Design Prompt

## App Context

zbite is a mobile-first recipe social platform. Users discover, save, cook, and share recipes. The design language is warm, earthy, and food-forward — cream backgrounds, rust-orange accents, serif headings (Playfair Display), and clean sans-serif body text (Inter).

---

## Design System Tokens

### Colors

| Token | Value | Usage |
|---|---|---|
| Primary | `#E85D2C` | Buttons, accents, active states |
| Primary Hover | `#D14D1E` | Hover/pressed states |
| Background | `#FFF8F0` | Page background |
| Card | `#FFFFFF` | Card surfaces |
| Text | `#2D1810` | Headings, body text |
| Text Secondary | `#7A6558` | Subtitles, metadata, captions |
| Border | `#F0E0D0` | Card borders, dividers |
| Success | `#4CAF50` | Success feedback |

### Typography

| Style | Font | Size | Weight |
|---|---|---|---|
| Page heading | Playfair Display | 36px mobile / 48px desktop | 700 |
| Section heading | Playfair Display | 22–26px | 600 |
| Card title | Playfair Display | 18–20px | 600 |
| Body | Inter | 16px | 400 |
| Button | Inter | 16px | 600 |
| Caption/meta | Inter | 13–14px | 400–500 |
| Badge/tag | Inter | 12px | 500 |

### Spacing & Radii

- Card radius: 12px
- Button radius: 12px
- Badge/pill radius: 20px (fully rounded)
- Card shadow: `0 2px 8px rgba(45,24,16,0.08)`
- Card padding: 14px
- Page horizontal padding: 24px mobile / 32px desktop
- Standard gap between sections: 24px

### Buttons

- **Primary**: `#E85D2C` background, white text, 12px radius, 16px 40px padding, subtle shadow
- **Outline**: transparent background, 2px `#E85D2C` border, orange text, 12px radius
- **Ghost/text**: no border, `#7A6558` text, underline on hover

---

## Screens to Design

All screens are mobile-first (375px width). Desktop is max 1200px centered.

---

### Screen 1: Choose Page — Mode Fork (Entry View)

**Route:** `/choose`

Full-height centered layout. No bottom tab bar visible (immersive flow).

**Content top-to-bottom:**

1. **Heading** (Playfair, 36px, centered): "What should I cook?"
2. **Subheading** (Inter, 16px, text-secondary, centered): "Pick a path to find your next meal."
3. **Two large mode buttons** (stacked vertically, full-width within 24px padding, 16px gap between them):

   - **"Help Me Decide"** button:
     - Primary style (orange bg, white text)
     - Icon on the left: a compass or lightbulb icon
     - Subtitle below the label in smaller text: "3 quick taps, zero typing"
     - Height: ~80px, rounded 16px corners
   - **"Use What I Have"** button:
     - Outline style (white bg, orange 2px border, orange text)
     - Icon on the left: a fridge or shopping bag icon
     - Subtitle below the label: "Type your ingredients, get matches"
     - Height: ~80px, rounded 16px corners

4. **Bottom text** (Inter, 13px, text-secondary, centered): "Takes less than 30 seconds"

---

### Screen 2: Choose Page — Path A, Step 1 (Time)

**Step indicator at top:** 3 circles connected by 2 lines. Circle 1 is filled orange, circles 2-3 are empty (border only). Lines are `#F0E0D0`.

**Content:**

1. **Heading** (Playfair, 28px): "How much time do you have?"
2. **Subheading** (Inter, 15px, text-secondary): "Pick one and we'll filter recipes."
3. **4 pill buttons** in a 2x2 grid (gap: 12px):
   - "Under 15 min"
   - "15–30 min"
   - "30–60 min"
   - "60+ min"
   - Each pill: white bg, `#F0E0D0` 2px border, 14px 24px padding, 20px radius, text centered
   - Hover/selected state: orange border, light orange bg (`#FFF0E8`)

**No "Next" button.** Tapping a pill auto-advances to Step 2.

---

### Screen 3: Choose Page — Path A, Step 2 (Category)

**Step indicator:** Circles 1-2 filled orange, circle 3 empty. Line between 1-2 is orange, line 2-3 is border color.

**Content:**

1. **Heading** (Playfair, 28px): "What do you want to eat?"
2. **9 pill buttons** in a 3x3 grid (gap: 10px):
   - Pasta, Chicken, Beef, Seafood, Vegetarian, Rice & Noodles, Soup & Stew, Salad & Bowl, Sandwich & Wrap
   - Same pill style as Step 1
3. **"Back" text button** (ghost style, centered below pills): "Back"

Tapping a pill auto-advances to Step 3.

---

### Screen 4: Choose Page — Path A, Step 3 (Preference)

**Step indicator:** All 3 circles filled orange, both lines orange.

**Content:**

1. **Heading** (Playfair, 28px): "Any preference?"
2. **Subheading** (Inter, 15px, text-secondary): "Optional — skip if you're open to anything."
3. **6 pill buttons** in a 2x3 grid:
   - Healthy, High Protein, Budget Friendly, Family Friendly, One Pan, Meal Prep
   - Same pill style
4. **"Skip" button** (outline style, full-width, below the pills): "Skip — Show Me Recipes"
5. **"Back" text button** (ghost, centered below): "Back"

Tapping a pill OR Skip navigates to Results page.

---

### Screen 5: Choose Page — Path B (Use What I Have)

**Single-view layout** with a "Back" arrow at top-left returning to mode fork.

**Content:**

1. **Heading** (Playfair, 28px): "What's in your kitchen?"
2. **Subheading** (Inter, 15px, text-secondary): "Type ingredients you have and hit enter."

3. **Text input area:**
   - Standard text input, full width, 12px radius, `#F0E0D0` border
   - Placeholder: "e.g. chicken, rice, garlic..."
   - On submit (Enter key): adds text as a chip below the input

4. **Ingredient chips** (below input, wrapping flex row, gap 8px):
   - Each chip: `#FFF0E8` bg, `#E85D2C` text, 20px radius pill, 8px 16px padding
   - Small "x" button on right side of each chip to remove
   - Example state: "chicken" chip, "rice" chip, "garlic" chip

5. **Optional time filter** (small section below chips):
   - Label (Inter, 13px, text-secondary): "Filter by time (optional)"
   - 4 small horizontal pills in a single row (smaller than Path A pills):
     "< 15 min", "15–30", "30–60", "60+"
   - Can select one or none. Selected = orange border + light bg.

6. **"Find Recipes" button** (primary style, full-width, bottom of content):
   - Disabled (gray, 50% opacity) until at least 1 chip is added
   - Enabled: orange bg, white text

---

### Screen 6: Results Page — With Results

**Route:** `/results?mode=pick&category=pasta&maxTime=30` (or `mode=pantry&ingredients=...`)

**Header:**
- Title (Playfair, 28px): "Your Picks"
- Chip(s) next to title showing active filters: e.g., "Pasta" chip + "Under 30 min" chip (small, border style, text-secondary color)

**Section: "Your Go-To"** (conditional — only shown for logged-in users who have matches):
- Section heading (Inter, 16px, 600 weight, text-secondary): "Your Go-To"
- Horizontal scroll row of 1–3 compact cards:
  - Each card: horizontal layout, 80px square image on left (rounded 8px), title + meta on right
  - Meta: "15 min" + saves count
  - Card bg white, subtle border, 10px radius
  - Entire row scrolls horizontally with 12px gap

**Section: Primary Pick:**
- Large vertical card (full-width):
  - 16:9 cover image with rounded top corners (12px)
  - Difficulty badge overlay on image (top-left): "easy" in green, "medium" in orange, "hard" in red
  - Category tag overlay on image (top-right): e.g., "Italian" in white bg pill
  - Below image: Title (Playfair, 20px), meta row (cooking time + saves count + servings), author row (avatar + username)
  - No star rating anywhere

**Section: "More Options":**
- Heading (Inter, 16px, 600, text-secondary): "More Options"
- 2–3 compact horizontal cards stacked vertically (12px gap):
  - Each: 80px square image left, title + time + saves right
  - Same style as "Your Go-To" cards

**Bottom actions:**
- "Show More" button (outline style, full-width)
- "Start Over" text link (ghost style, centered below)

---

### Screen 7: Results Page — Empty State

Same header as above, but instead of recipe cards:

- Centered illustration area (placeholder for empty-state illustration)
- Text (Inter, 16px, text-secondary, centered): "No recipes match your filters."
- Subtext (Inter, 14px, centered): "Try different options or use fewer filters."
- "Start Over" button (primary style, centered): "Try Again"

---

### Screen 8: Home Page — Logged-In User

**Route:** `/`

**Hero Section** (gradient bg: `#fff8f0` to `#ffe8d6` to `#ffd6b8`):
- Heading (Playfair, 36px): "What should I cook?"
- Subheading (Inter, 16px, text-secondary): "Find your next meal in seconds."
- 3 step badges in a horizontal row:
  - Step 1: "Pick your time" (orange circle with "1", label below)
  - Step 2: "Choose what to eat" (circle with "2")
  - Step 3: "Start cooking" (circle with "3")
- Two buttons side by side:
  - "Help Me Choose" (primary, orange)
  - "Surprise Me" (outline)

**Section: "Make It Again":**
- Heading row: "Make It Again" (Playfair, 22px) + "See All" link (text-secondary, right-aligned)
- Horizontal scroll row of recipe cards (standard card: vertical, 160px wide, cover image top, title + time below)
- Only shown if user has previously cooked or saved recipes

**Section: "{Interest} for You"** (e.g., "Italian for You"):
- Same layout pattern as above
- Heading includes the user's top interest tag
- Shows recipes matching that interest
- Up to 2 of these rows (one per top interest)

**Section: "Ready in 30":**
- Same horizontal scroll row
- Shows quick recipes filtered by user interests
- Heading: "Ready in 30" (Playfair, 22px)

**Section: "What Others Are Cooking":**
- Same horizontal scroll row
- Generic trending recipes
- Heading: "What Others Are Cooking"

**Section: "Just Added":**
- Same horizontal scroll row
- Recipes from the last 7 days
- Heading: "Just Added"

---

### Screen 9: Home Page — Guest (Not Logged In)

Same hero section as logged-in. Below hero:

- "What Others Are Cooking" section (trending)
- "Ready in 30" section (generic quick recipes)
- "Just Added" section (new recipes)

No "Make It Again" or interest-based rows (no user data).

---

### Screen 10: Recipe Detail — Updated

**Changes from current design:**

1. **Remove star rating badge** from the meta badges row below the title. Keep only: difficulty badge + cooking time chip + servings chip.

2. **Remove the "Rate this recipe" section** with the star rating input. Remove entirely.

3. **Remove the like button (heart)** from the ActionBar. ActionBar now shows only:
   - Comment button (speech bubble icon + count)
   - Share button (share icon)
   - Save button (bookmark icon, filled when saved)

4. **Add "I Cooked This" button** — placed between the Steps section and the Comment section:
   - Full-width button, outline style (same visual pattern as the "Add to Shopping List" button above it)
   - Label: "I Cooked This"
   - Icon on left: a chef hat or checkmark icon
   - On tap: shows success toast "Nice! Cooking streak updated"

5. **Related recipes cards at bottom:** Remove star rating display. Show only: cover image, title, cooking time.

---

### Screen 11: Recipe Cards — Updated (Used Across App)

All recipe card variants throughout the app should be updated:

**Remove from ALL card types:**
- Star rating display (the "★ 4.2" text)
- Like count / heart icon
- Any rating-related indicators

**Keep on all cards:**
- Cover image
- Title
- Cooking time ("15 min")
- Saves count (bookmark icon + number)
- Author avatar + username (where space allows)
- Difficulty badge (where applicable)

**Card variants used in the app:**
- **Feed Card** (vertical, full-width): cover image, title, author row, time + saves meta. No double-tap heart animation.
- **Explore Card** (grid, ~half width): cover image, title, time + saves. No star rating.
- **Leaderboard/Home Row Card** (horizontal scroll, ~160px wide): cover image top, title + time below.
- **Result Card Primary** (vertical, full-width): large cover, title, meta, author. No stars.
- **Result Card Compact** (horizontal, 80px image left, text right): title, time, saves.

---

## Design Notes

- **Mobile-first**: all screens designed at 375px width. Desktop simply centers content at max 1200px with more padding.
- **No dark mode** — single warm light theme throughout.
- **Bottom tab bar** (64px, fixed) is visible on Home, Explore, and Profile pages. NOT visible during the Choose flow (immersive).
- **Transitions**: steps in the Choose flow should feel smooth — consider slide-left animation between steps.
- **Empty states** should feel encouraging, not punishing. Warm copy, inviting to try again.
- **Accessibility**: all interactive elements need focus states. Minimum 4.5:1 contrast ratio. Semantic button elements.
