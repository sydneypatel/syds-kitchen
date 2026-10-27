import { supabase } from "./backend";
import type { Profile, RecipeDraft } from "./types";

/* ---------------- TheMealDB (free, no key needed) ---------------- */

const MEALDB = "https://www.themealdb.com/api/json/v1/1";

export type MealSummary = { id: string; title: string; image: string };

type Meal = Record<string, string | null>;

export async function searchMeals(query: string, by: "name" | "ingredient"): Promise<MealSummary[]> {
  const q = encodeURIComponent(query.trim());
  const url = by === "name" ? `${MEALDB}/search.php?s=${q}` : `${MEALDB}/filter.php?i=${q.replace(/%20/g, "_")}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("TheMealDB didn't respond. Try again.");
  const data = (await res.json()) as { meals: Meal[] | null };
  return (data.meals ?? []).map((m) => ({ id: m.idMeal!, title: m.strMeal!, image: m.strMealThumb! }));
}

export async function randomMeals(n = 6): Promise<MealSummary[]> {
  const results = await Promise.all(
    Array.from({ length: n }, () =>
      fetch(`${MEALDB}/random.php`)
        .then((r) => r.json() as Promise<{ meals: Meal[] }>)
        .catch(() => ({ meals: [] as Meal[] })),
    ),
  );
  const seen = new Set<string>();
  return results
    .flatMap((r) => r.meals ?? [])
    .filter((m) => !seen.has(m.idMeal!) && seen.add(m.idMeal!))
    .map((m) => ({ id: m.idMeal!, title: m.strMeal!, image: m.strMealThumb! }));
}

/** TheMealDB doesn't give times, so estimate from the number and length of steps. */
function estimate(steps: string[], ingredientCount: number) {
  const text = steps.join(" ").toLowerCase();
  const explicit = [...text.matchAll(/(\d+)\s*(?:-\s*\d+\s*)?(min|minute|hour|hr)/g)].reduce((sum, m) => sum + Number(m[1]) * (m[2].startsWith("h") ? 60 : 1), 0);
  const prep = Math.min(30, 5 + ingredientCount * 1.5);
  const cook = Math.min(120, Math.max(15, explicit || steps.length * 6));
  return { prep: Math.round(prep / 5) * 5, cook: Math.round(cook / 5) * 5, clean: 10 };
}

export async function getMeal(id: string): Promise<RecipeDraft> {
  const res = await fetch(`${MEALDB}/lookup.php?i=${encodeURIComponent(id)}`);
  const data = (await res.json()) as { meals: Meal[] | null };
  const m = data.meals?.[0];
  if (!m) throw new Error("Recipe not found.");
  const ingredients = Array.from({ length: 20 }, (_, i) => ({ name: (m[`strIngredient${i + 1}`] || "").trim(), qty: (m[`strMeasure${i + 1}`] || "").trim() }))
    .filter((x) => x.name)
    .map((x) => ({ name: x.name.toLowerCase(), qty: x.qty || undefined }));
  const steps = (m.strInstructions || "")
    .split(/\r?\n+/)
    .map((s) => s.replace(/^\s*(step\s*)?\d+[.):]?\s*/i, "").trim())
    .filter((s) => s.length > 3);
  const t = estimate(steps, ingredients.length);
  const tags = [m.strArea, m.strCategory, ...(m.strTags || "").split(",")].map((s) => (s || "").trim()).filter(Boolean);
  if (m.strCategory === "Vegetarian" || m.strCategory === "Vegan") tags.push("Vegetarian");
  return {
    title: m.strMeal || "Untitled",
    description: [m.strArea, m.strCategory].filter(Boolean).join(" · ") + " · times estimated",
    ...t,
    servings: 4,
    image: m.strMealThumb,
    ingredients,
    steps,
    tags: [...new Set(tags)],
    source: "mealdb",
    source_url: m.strSource || `https://www.themealdb.com/meal/${m.idMeal}`,
  };
}

/* ---------------- Claude suggestions (via /api/suggest) ---------------- */

export async function suggestRecipes(args: { minutes: number; pantry: string[]; staples: string[]; useSoon: string[]; profile: Profile; count?: number; request?: string }): Promise<RecipeDraft[]> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const res = await fetch("/api/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
    body: JSON.stringify({
      minutes: args.minutes,
      pantry: args.pantry,
      staples: args.staples,
      useSoon: args.useSoon,
      eatMinutes: args.profile.eat_minutes,
      count: args.count ?? 3,
      request: args.request,
      profile: { living: args.profile.living, style: args.profile.style, diets: args.profile.diets, avoid: args.profile.avoid, cuisines: args.profile.cuisines, kitchen: args.profile.kitchen, skill: args.profile.skill, notes: args.profile.notes },
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { recipes?: Omit<RecipeDraft, "source" | "source_url" | "image">[]; error?: string };
  if (!res.ok) throw new Error(data.error || "Couldn't get suggestions right now.");
  return (data.recipes ?? []).map((r) => ({
    ...r,
    ingredients: (r.ingredients ?? []).map((i) => ({ name: i.name.toLowerCase(), qty: i.qty || undefined })),
    image: null,
    source: "ai" as const,
    source_url: null,
  }));
}

/* ---------------- Import from link or text (via /api/import) ---------------- */

export type ImportedRecipe = {
  title: string;
  description: string;
  image: string | null;
  prep: number | null;
  cook: number | null;
  clean: number | null;
  servings: number | null;
  ingredients: string[];
  steps: string[];
  tags: string[];
  source_url: string | null;
  via: "page-data" | "claude";
};

export async function importRecipe(input: string): Promise<ImportedRecipe> {
  const trimmed = input.trim();
  const isUrl = /^https?:\/\/\S+$/i.test(trimmed);
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const res = await fetch("/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
    body: JSON.stringify(isUrl ? { url: trimmed } : { text: trimmed }),
  });
  const data = (await res.json().catch(() => ({}))) as { recipe?: ImportedRecipe; error?: string };
  if (!res.ok || !data.recipe) throw new Error(data.error || "Couldn't import that. Try pasting the recipe text.");
  return data.recipe;
}
