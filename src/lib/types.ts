export type Aisle = "Produce" | "Pantry" | "Refrigerated" | "Frozen" | "Other";
export const AISLES: Aisle[] = ["Produce", "Pantry", "Refrigerated", "Frozen", "Other"];

export type Storage = "Fridge" | "Freezer" | "Pantry" | "Spices";
export const STORAGES: Storage[] = ["Fridge", "Freezer", "Pantry", "Spices"];
/** Where food lives; spices, sauces and oils get their own section. */
export const MAIN_STORAGES: Storage[] = ["Fridge", "Freezer", "Pantry"];
export const STORAGE_LABEL: Record<Storage, string> = { Fridge: "Fridge", Freezer: "Freezer", Pantry: "Pantry", Spices: "Spices, sauces & oils" };

export type Ingredient = { name: string; qty?: string };

export type RecipeSource = "manual" | "mealdb" | "ai";

export type Recipe = {
  id: string;
  title: string;
  description: string;
  prep: number;
  cook: number;
  clean: number;
  servings: number;
  image: string | null;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  source: RecipeSource;
  source_url: string | null;
  favorite: boolean;
  rating: number | null;
  notes: string;
  created_at: string;
};

export type PantryItem = {
  id: string;
  name: string;
  storage: Storage;
  expires_on: string | null; // yyyy-mm-dd
  created_at: string;
};

export type ShoppingItem = {
  id: string;
  name: string;
  aisle: Aisle;
  checked: boolean;
  recipe_id: string | null;
  created_at: string;
};

export type PlanEntry = {
  id: string;
  day: string; // yyyy-mm-dd
  recipe_id: string;
  servings: number;
  created_at: string;
};

export type Profile = {
  id: string;
  name: string;
  onboarded: boolean;
  diets: string[];
  avoid: string[];
  cuisines: string[];
  kitchen: string[];
  inspiration: string[];
  skill: string[];
  notes: string;
  eat_minutes: number;
  store: string;
};

export type Tables = {
  recipes: Recipe;
  pantry_items: PantryItem;
  shopping_items: ShoppingItem;
  plan_entries: PlanEntry;
};
export type TableName = keyof Tables;

export type Data = {
  profile: Profile;
  recipes: Recipe[];
  pantry_items: PantryItem[];
  shopping_items: ShoppingItem[];
  plan_entries: PlanEntry[];
};

export const DEFAULT_PROFILE: Omit<Profile, "id"> = {
  name: "",
  onboarded: false,
  diets: [],
  avoid: [],
  cuisines: [],
  kitchen: [],
  inspiration: [],
  skill: [],
  notes: "",
  eat_minutes: 15,
  store: "Gristedes · Roosevelt Island",
};

/** A recipe draft before it's saved (from AI, TheMealDB, or the form). */
export type RecipeDraft = Omit<Recipe, "id" | "created_at" | "favorite" | "rating" | "notes"> & Partial<Pick<Recipe, "favorite" | "rating" | "notes">>;
