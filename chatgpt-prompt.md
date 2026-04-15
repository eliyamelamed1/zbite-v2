# ChatGPT Prompt — zbite Strategic Analysis

Copy everything below the line and paste it into ChatGPT:

---

I built a recipe social platform called **zbite**. I want you to act as a startup advisor who has deeply studied the best entrepreneurship books (Lean Startup, Zero to One, Hooked, The Mom Test, Crossing the Chasm, Traction, Blue Ocean Strategy, $100M Offers, Built to Last, Good to Great) and has analyzed the growth stories of successful consumer apps (Instagram, TikTok, Pinterest, Allrecipes, Tasty/BuzzFeed, Yummly, Cookpad, Paprika, Mealime, Whisk, Supercook).

## What zbite is

zbite is a recipe social platform where people discover, create, cook, and share recipes. It's built as a web app (React + Node.js + MongoDB). Here's everything it does today:

### Core Discovery
- **Mood-Based Recipe Picker** ("What should I cook?"): A 3-step wizard where users pick available time (0-15 min, 15-30, 30-60, 60+), cuisine category (12 options: Italian, Asian, Mexican, etc.), and dietary preference (Vegan, Gluten-Free, High-Protein, etc.). Returns matching recipes.
- **Pantry Search** ("Use What I Have"): Users type ingredients they have at home, and the app finds recipes they can make with those ingredients.
- **Personalized Home Page**: For logged-in users, shows interest-based rows ("Italian for You", "Asian for You"), recently saved recipes ("Make It Again"), quick recipes ("Ready in 30"), trending, and new recipes. Guests see generic curated rows.
- **Feed Page**: Sort by Trending, Following, Recent, Quick, or Top Rated. Filter by cuisine/dietary tags. Shows top chefs to follow.
- **Full-Text Search**: Dual-tab search for recipes (searches title, description, ingredients, tags) and chefs (searches username, bio).

### Recipe Creation
- **5-Step Recipe Wizard**: Cover photo upload, basics (title, description, difficulty, time, servings, tags), ingredients list, step-by-step instructions with per-step images and nutrition info (calories, protein, carbs, fat), then a success screen with confetti celebration.
- **Recipe Editing**: Authors can edit their own recipes.
- **Draft System**: Recipes can be saved as drafts before publishing.

### Social Features
- **Follow System**: Follow/unfollow users. View followers/following lists with pagination.
- **Comments with Nested Replies**: Comment on recipes, reply to specific comments, delete own comments.
- **Save/Bookmark**: Save recipes to personal library. View saved recipes with tag filtering.
- **Notifications Center**: Activity feed grouped by time (Today, This Week, Earlier). Notification types: new follower, recipe saved, comment received, @mention in comment, cooking report received. Auto-marks as read when viewed.
- **Cooking Reports**: Users can upload a photo + notes of their attempt cooking someone's recipe. Appears on the recipe detail page. Notifies the recipe author.

### Recipe Detail Experience
- Full recipe page with cover image, author card, difficulty badge, cooking time.
- **Servings Adjuster**: Dynamically scales all ingredient amounts when you change serving count.
- **Add to Shopping List**: One-click adds all ingredients to your personal shopping list.
- **Cook Mode**: Full-screen step-by-step cooking interface showing one step at a time.
- **Related Recipes**: Shows 4 recipes with similar tags.

### Gamification & Creator Tools
- **Cooking Streaks**: Tracks consecutive days of cooking. Shows current streak, longest streak, total dishes cooked.
- **Achievement Badges**: First Cook, 7-Day Streak, 30-Day Streak, 5 Cuisines Explored, 10 Recipes Created, 50 Recipes Created.
- **Chef Score**: Reputation metric combining recipe creation, engagement received (saves, comments), cooking reports from others, and follower count.
- **Leaderboard**: Ranked top chefs by Chef Score with Weekly, Monthly, and All-Time views. Top 3 get podium display.
- **Creator Analytics Dashboard**: Overview stats (total recipes, saves, followers, score), per-recipe performance metrics, daily engagement time-series chart (last 30 days).

### Utility Features
- **Shopping List**: Checklist of ingredients from saved recipes. Check off items as you buy them. Clear all.
- **Collections**: Create custom recipe lists (e.g., "Party Appetizers", "Weeknight Dinners"). Add/remove recipes from collections.
- **User Profiles**: Avatar, bio, recipe count, follower/following counts, chef score, published recipes tab, saved recipes tab (own profile), streak display, achievement badges.

### Technical Details
- **Stack**: React 18, Fastify (Node.js), MongoDB Atlas, TypeScript end-to-end
- **Authentication**: JWT-based with multi-step signup wizard (email/password, then username/avatar/bio/interests)
- **SEO**: JSON-LD structured data (Recipe schema, Person, WebSite, BreadcrumbList, ItemList), dynamic sitemap, bot pre-rendering middleware, meta tags on all pages
- **Deployment**: Docker container on Render.com, persistent storage for uploads, GitHub Actions CI
- **50+ API endpoints** across 12 backend modules

## What I want from you

Based on the best entrepreneurship books and real app success stories, analyze zbite and tell me:

### 1. Product-Market Fit Assessment
- Where does zbite sit on the "must-have" vs "nice-to-have" spectrum?
- What's the core value proposition? Is it clear enough?
- Who is the ideal first user (the "hair on fire" customer from The Mom Test)?
- What would make someone switch FROM their current solution TO zbite?

### 2. What's Missing (Critical Gaps)
- What features or capabilities are missing that successful recipe/food apps have?
- What does the competitive landscape say I must have that I don't?
- What would the Lean Startup say I'm overbuilding vs. underbuilding?
- Based on the "Hooked" model (Trigger > Action > Variable Reward > Investment) — where are my hook gaps?

### 3. Growth & Traction Strategy
- What are the best acquisition channels for a recipe social platform? (Based on Traction's "Bullseye Framework")
- What viral loops exist in the current product? What viral loops am I missing?
- What's my "aha moment" — the action that separates retained users from churned users?
- What retention mechanisms should I add?

### 4. Monetization Readiness
- Based on $100M Offers — what could my "Grand Slam Offer" look like?
- What monetization models work for recipe/food platforms?
- Am I building a feature set that supports eventual monetization?

### 5. Strategic Positioning
- Based on Blue Ocean Strategy — is zbite competing in a red ocean or creating a blue ocean?
- What's my "10x better" differentiator (Zero to One)?
- How should I position against Allrecipes, Tasty, Yummly, Cookpad, Paprika, Supercook?

### 6. Prioritized Action Plan
- Give me a ranked list of the top 10 things I should do next, ordered by impact.
- For each, cite which book/framework supports this recommendation.
- Separate into: things to BUILD, things to REMOVE/SIMPLIFY, and things to DO (non-code actions like marketing, community, partnerships).

Be specific and actionable. Don't give me generic startup advice — reference my actual features and gaps. Challenge my assumptions. Tell me what I'm wrong about.
