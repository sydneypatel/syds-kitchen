import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { Backend } from "./backend";
import { guessAisle, guessStorage, inPantry, sameFood, titleCase, uid } from "./food";
import type { Aisle, Data, PantryItem, PlanEntry, Profile, Recipe, RecipeDraft, ShoppingItem, Storage } from "./types";

type Store = Data & {
  error: string | null;
  clearError(): void;
  saveProfile(patch: Partial<Profile>): void;
  addPantry(name: string, storage?: Storage, expires_on?: string | null): void;
  updatePantry(id: string, patch: Partial<PantryItem>): void;
  removePantry(ids: string[]): void;
  saveRecipe(draft: RecipeDraft, id?: string): Recipe;
  updateRecipe(id: string, patch: Partial<Recipe>): void;
  removeRecipe(id: string): void;
  addShopping(names: string[], aisle?: Aisle, recipe_id?: string | null): number;
  updateShopping(id: string, patch: Partial<ShoppingItem>): void;
  removeShopping(ids: string[]): void;
  moveCheckedToPantry(): number;
  addPlan(day: string, recipe_id: string, servings?: number): void;
  removePlan(id: string): void;
};

const Ctx = createContext<Store | null>(null);

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}

const now = () => new Date().toISOString();

export function StoreProvider({ initial, backend, children }: { initial: Data; backend: Backend; children: ReactNode }) {
  const [data, setData] = useState<Data>(initial);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef(data);

  // Optimistic update; persist in background and surface errors.
  const persist = useCallback((p: Promise<void>) => {
    p.catch((e: Error) => setError(e.message || "Couldn't save. Check your connection."));
  }, []);

  const set = useCallback((fn: (d: Data) => Data) => {
    const next = fn(ref.current);
    ref.current = next;
    setData(next);
  }, []);

  const store = useMemo<Store>(() => {
    const api: Omit<Store, keyof Data | "error"> = {
      clearError: () => setError(null),
      saveProfile(patch) {
        const profile = { ...ref.current.profile, ...patch };
        set((d) => ({ ...d, profile }));
        persist(backend.saveProfile(profile));
      },
      addPantry(name, storage, expires_on = null) {
        const clean = titleCase(name);
        if (!clean || ref.current.pantry_items.some((p) => p.name.toLowerCase() === clean.toLowerCase())) return;
        const row: PantryItem = { id: uid(), name: clean, storage: storage ?? guessStorage(clean), expires_on, created_at: now() };
        set((d) => ({ ...d, pantry_items: [...d.pantry_items, row] }));
        persist(backend.insert("pantry_items", row));
      },
      updatePantry(id, patch) {
        set((d) => ({ ...d, pantry_items: d.pantry_items.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
        persist(backend.update("pantry_items", id, patch));
      },
      removePantry(ids) {
        set((d) => ({ ...d, pantry_items: d.pantry_items.filter((p) => !ids.includes(p.id)) }));
        persist(backend.remove("pantry_items", ids));
      },
      saveRecipe(draft, id) {
        const existing = id ? ref.current.recipes.find((r) => r.id === id) : undefined;
        const recipe: Recipe = {
          favorite: false,
          rating: null,
          notes: "",
          ...existing,
          ...draft,
          id: existing?.id ?? uid(),
          created_at: existing?.created_at ?? now(),
        };
        if (existing) {
          set((d) => ({ ...d, recipes: d.recipes.map((r) => (r.id === recipe.id ? recipe : r)) }));
          const { id: _id, created_at: _c, ...patch } = recipe;
          persist(backend.update("recipes", recipe.id, patch));
        } else {
          set((d) => ({ ...d, recipes: [recipe, ...d.recipes] }));
          persist(backend.insert("recipes", recipe));
        }
        return recipe;
      },
      updateRecipe(id, patch) {
        set((d) => ({ ...d, recipes: d.recipes.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
        persist(backend.update("recipes", id, patch));
      },
      removeRecipe(id) {
        const planIds = ref.current.plan_entries.filter((p) => p.recipe_id === id).map((p) => p.id);
        set((d) => ({ ...d, recipes: d.recipes.filter((r) => r.id !== id), plan_entries: d.plan_entries.filter((p) => p.recipe_id !== id) }));
        persist(backend.remove("plan_entries", planIds).then(() => backend.remove("recipes", [id])));
      },
      addShopping(names, aisle, recipe_id = null) {
        const current = ref.current.shopping_items;
        const rows: ShoppingItem[] = [];
        for (const raw of names) {
          const name = titleCase(raw);
          if (!name) continue;
          if ([...current, ...rows].some((s) => !s.checked && sameFood(s.name, name))) continue;
          rows.push({ id: uid(), name, aisle: aisle ?? guessAisle(name), checked: false, recipe_id, created_at: now() });
        }
        if (!rows.length) return 0;
        set((d) => ({ ...d, shopping_items: [...d.shopping_items, ...rows] }));
        for (const r of rows) persist(backend.insert("shopping_items", r));
        return rows.length;
      },
      updateShopping(id, patch) {
        set((d) => ({ ...d, shopping_items: d.shopping_items.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
        persist(backend.update("shopping_items", id, patch));
      },
      removeShopping(ids) {
        set((d) => ({ ...d, shopping_items: d.shopping_items.filter((s) => !ids.includes(s.id)) }));
        persist(backend.remove("shopping_items", ids));
      },
      moveCheckedToPantry() {
        const checked = ref.current.shopping_items.filter((s) => s.checked);
        for (const s of checked) if (!inPantry(s.name, ref.current.pantry_items)) api.addPantry(s.name);
        api.removeShopping(checked.map((s) => s.id));
        return checked.length;
      },
      addPlan(day, recipe_id, servings = 1) {
        const row: PlanEntry = { id: uid(), day, recipe_id, servings, created_at: now() };
        set((d) => ({ ...d, plan_entries: [...d.plan_entries, row] }));
        persist(backend.insert("plan_entries", row));
      },
      removePlan(id) {
        set((d) => ({ ...d, plan_entries: d.plan_entries.filter((p) => p.id !== id) }));
        persist(backend.remove("plan_entries", [id]));
      },
    };
    return { ...data, error, ...api };
  }, [data, error, backend, persist, set]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}
