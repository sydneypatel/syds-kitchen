import type { Aisle, PantryItem, Recipe } from "./types";

/** Things almost every kitchen has; never counted as "missing". */
const STAPLES = ["salt", "pepper", "black pepper", "water", "olive oil", "oil", "vegetable oil", "sugar", "ice"];

const DESCRIPTORS = /\b(fresh|large|small|medium|chopped|diced|minced|sliced|ground|dried|frozen|canned|raw|cooked|boneless|skinless|ripe|extra|virgin|organic|whole|finely|roughly|to taste|optional|of|a|an|the|and)\b/g;

export function normalize(name: string): string {
  let s = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\(.*?\)/g, " ").replace(/[^a-z\s-]/g, " ").replace(DESCRIPTORS, " ").replace(/\s+/g, " ").trim();
  s = s
    .split(" ")
    .map((w) => (w.endsWith("ies") ? w.slice(0, -3) + "y" : w.endsWith("oes") ? w.slice(0, -2) : w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w))
    .join(" ");
  return s;
}

export function isStaple(name: string) {
  const n = normalize(name);
  return STAPLES.some((s) => n === normalize(s));
}

/** Loose match: "baby spinach" matches "spinach", "cherry tomatoes" matches "tomato". */
export function sameFood(a: string, b: string) {
  const x = normalize(a);
  const y = normalize(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const wx = x.split(" ");
  const wy = y.split(" ");
  const [short, long] = wx.length <= wy.length ? [wx, wy] : [wy, wx];
  // every word of the shorter name appears in the longer one
  return short.every((w) => long.includes(w));
}

export function inPantry(name: string, pantry: PantryItem[]) {
  return isStaple(name) || pantry.some((p) => sameFood(p.name, name));
}

export function missingFor(recipe: Recipe, pantry: PantryItem[]) {
  return recipe.ingredients.map((i) => i.name).filter((n) => !inPantry(n, pantry));
}

export function totalMinutes(recipe: Pick<Recipe, "prep" | "cook" | "clean">, eat = 0) {
  return recipe.prep + recipe.cook + recipe.clean + eat;
}

const AISLE_WORDS: Record<Exclude<Aisle, "Other">, string[]> = {
  Produce: ["apple", "avocado", "banana", "basil", "bean sprout", "bell pepper", "berry", "broccoli", "cabbage", "carrot", "cauliflower", "celery", "chili", "cilantro", "corn", "cucumber", "eggplant", "garlic", "ginger", "green onion", "herb", "kale", "leek", "lemon", "lettuce", "lime", "mango", "mint", "mushroom", "onion", "orange", "parsley", "pea", "potato", "scallion", "shallot", "spinach", "squash", "sweet potato", "thyme", "tomato", "zucchini", "arugula", "beet", "jalapeno", "rosemary", "dill", "fruit", "salad", "greens"],
  Refrigerated: ["butter", "cheese", "chicken", "cream", "egg", "feta", "milk", "mozzarella", "parmesan", "yogurt", "tofu", "tempeh", "beef", "pork", "salmon", "fish", "shrimp", "turkey", "sausage", "bacon", "ham", "hummus", "tortilla", "paneer", "lamb", "steak", "cheddar", "ricotta"],
  Frozen: ["ice cream", "edamame"],
  Pantry: ["bread", "broth", "stock", "can", "chickpea", "bean", "lentil", "flour", "honey", "noodle", "oat", "oil", "pasta", "spaghetti", "penne", "rice", "quinoa", "sauce", "sesame", "soy", "spice", "sugar", "tahini", "vinegar", "cumin", "paprika", "cinnamon", "nut", "almond", "peanut", "seed", "maple", "coconut milk", "curry", "salsa", "cereal", "cracker", "mustard", "ketchup", "mayo", "tuna", "oregano", "turmeric", "powder", "syrup", "couscous"],
};

export function guessAisle(name: string): Aisle {
  const n = normalize(name);
  if (/\bfrozen\b/i.test(name)) return "Frozen";
  if (/\b(powder|dried|canned|can|jar|paste|flakes|coconut milk|peanut butter|almond butter|nut butter)\b/i.test(name)) return "Pantry";
  const has = (w: string) => { const k = normalize(w); return !!k && new RegExp(`\\b${k}\\b`).test(n); };
  for (const aisle of ["Refrigerated", "Frozen", "Produce", "Pantry"] as const) {
    if (AISLE_WORDS[aisle].some(has)) return aisle;
  }
  return "Other";
}

/** Spices, sauces, oils, vinegars and condiments: the "flavor shelf". */
const SEASONINGS = ["salt", "pepper", "cumin", "paprika", "turmeric", "cinnamon", "nutmeg", "oregano", "chili", "chilli", "cayenne", "coriander", "cardamom", "clove", "garam masala", "masala", "curry", "za'atar", "zaatar", "sumac", "allspice", "bay leaf", "bay leaves", "italian seasoning", "everything bagel", "fennel seed", "mustard seed", "sesame seed", "red pepper flakes", "vanilla", "msg", "bouillon", "stock cube", "soy sauce", "tamari", "fish sauce", "oyster sauce", "hoisin", "sriracha", "hot sauce", "gochujang", "miso", "harissa", "pesto", "ketchup", "mustard", "mayo", "mayonnaise", "bbq sauce", "barbecue sauce", "worcestershire", "teriyaki", "chili crisp", "chili oil", "salsa", "honey", "maple syrup", "vinegar", "olive oil", "sesame oil", "vegetable oil", "canola oil", "avocado oil", "coconut oil", "ghee"];

export function isSeasoning(name: string) {
  const raw = name.toLowerCase();
  if (/\b(powder|spice|spices|seasoning|sauce|oil|vinegar|flakes|rub|dressing|condiment)\b/.test(raw)) return true;
  return SEASONINGS.some((w) => new RegExp(`\\b${w}\\b`).test(raw)) && !/\b(fresh|bell|jalape|greens|leaves)/.test(raw.replace("bay leaves", "bay"));
}

export function guessStorage(name: string): PantryItem["storage"] {
  if (isSeasoning(name)) return "Spices";
  const aisle = guessAisle(name);
  if (aisle === "Frozen") return "Freezer";
  if (aisle === "Refrigerated" || aisle === "Produce") return "Fridge";
  return "Pantry";
}

export function titleCase(s: string) {
  const t = s.trim();
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date + "T00:00:00");
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function isoDay(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - dow);
  return x;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function uid() {
  return crypto.randomUUID();
}
