# My Kitchen: personal meal prep app

My own meal-planning app, built from the Kindred Figma Make prototype (HCI class). It runs on a laptop or phone, syncs through Supabase, and is hosted on Vercel. Everything runs on free tiers; the only cost is the Claude API, at fractions of a cent per idea request.

**What it does**

- **Home:** time slider ("How much time do you have?") → recipes that fit, counting prep + cook + eat + cleanup
- **Ingredients:** what's in the fridge, freezer and pantry, with use-by dates. Items expiring soon get flagged
- **Recipes:** your own (manual form), saved from TheMealDB, or Claude ideas. Each recipe shows what you have and what you still need
- **Plan:** put recipes on days, then click "Shop for the week" to build one de-duplicated shopping list
- **Shopping list:** grouped by aisle. Check items off, then "Move to kitchen" adds them to your pantry
- **Favorites:** ratings and notes. **Profile:** diet, cuisines, kitchen setup, and usual store. Claude uses these for its ideas

## Run it locally

```bash
npm install
cp .env.example .env.local   # fill in what you have (all optional)
npm run dev                  # http://localhost:5173
```

With no Supabase keys, the app runs in **local mode**: no login, and data stays in that browser's storage. With only `ANTHROPIC_API_KEY` set, local mode also gets Claude ideas.

## One-time setup (all free)

### 1. Supabase (database + email login)
1. Create a project at https://supabase.com (free plan).
2. **SQL Editor** → paste `supabase/schema.sql` → Run.
3. **Authentication → URL Configuration**: set *Site URL* to your Vercel URL. Add `http://localhost:5173` under *Redirect URLs*.
4. **Project Settings → API**: copy the Project URL and the `anon` public key.
5. Once you've signed in once, go to **Authentication → Sign In / Providers** and turn off *Allow new users to sign up*. After that, only you can get in.

> Free Supabase projects pause after about a week with no activity. If the app says it can't load, open the Supabase dashboard and click *Restore*.

### 2. Claude API key
Create a key at https://console.anthropic.com, then set a monthly spend limit under *Limits*.

### 3. Vercel (hosting)
1. Import this GitHub repo at https://vercel.com/new (Hobby plan). It detects Vite automatically.
2. Add these Environment Variables:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `ANTHROPIC_API_KEY` | your Claude key (server-only, never sent to the browser) |
| `ALLOWED_EMAILS` | your email. The AI endpoint refuses anyone else |
| `ANTHROPIC_MODEL` | optional, defaults to `claude-haiku-5-5` |

3. Deploy. Every push to `main` redeploys.

## Code map

- `src/screens/*` — one file per screen (Home, MealOptions, Ingredients, Recipes, RecipeView, RecipeForm, Browse, Plan, Shopping, Favorites, Profile, Login, Onboarding)
- `src/lib/store.tsx` — app state and all data actions (optimistic updates)
- `src/lib/backend.ts` — Supabase or localStorage persistence
- `src/lib/food.ts` — ingredient matching, aisle guessing, date helpers
- `src/lib/sources.ts` — TheMealDB and Claude clients
- `api/suggest.ts` — Vercel function that calls Claude (also served by `vite.config.ts` in dev)
- `src/index.css` — Kindred palette and type (Gloock + DM Sans) from the Figma
