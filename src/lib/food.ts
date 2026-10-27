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
  Produce: ["apple", "avocado", "banana", "basil", "bean sprout", "bell pepper", "berry", "broccoli", "cabbage", "carrot", "cauliflower", "celery", "chili", "cilantro", "corn", "cucumber", "eggplant", "garlic", "ginger", "green onion", "herb", "kale", "leek", "lemon", "lettuce", "lime", "mango", "mint", "mushroom", "onion", "orange", "parsley", "pea", "potato", "scallion", "shallot", "spinach", "squash", "sweet potato", "thyme", "tomato", "zucchini", "arugula", "beet", "jalapeno", "rosemary", "dill", "fruit", "salad", "greens", "strawberry", "blueberry", "raspberry", "blackberry", "grape", "pear"],
  Refrigerated: ["leftover", "butter", "cheese", "chicken", "cream", "egg", "feta", "milk", "mozzarella", "parmesan", "yogurt", "tofu", "tempeh", "beef", "pork", "salmon", "fish", "shrimp", "turkey", "sausage", "bacon", "ham", "hummus", "tortilla", "paneer", "lamb", "steak", "cheddar", "ricotta"],
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
  return SEASONINGS.some((w) => new RegExp(`\\b${w}\\b`).test(raw)) && !/\b(fresh|bell|jalape|greens|leaves|leftover)/.test(raw.replace("bay leaves", "bay"));
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

/* ---------------- Typical shelf life (estimates you can edit) ---------------- */

// [days, words]. First match wins, so specific items come before general ones.
const SHELF_LIFE: [number, string[]][] = [
  [2, ["chicken", "turkey", "ground beef", "ground pork", "ground meat", "mince", "fish", "salmon", "tuna steak", "cod", "tilapia", "shrimp", "scallop", "seafood"]],
  [3, ["beef", "steak", "pork", "lamb", "fresh pasta", "raspberry"]],
  [4, ["berry", "strawberry", "blueberry", "blackberry", "avocado", "leftover", "bean sprout"]],
  [5, ["spinach", "lettuce", "arugula", "salad", "greens", "kale", "basil", "cilantro", "parsley", "mint", "dill", "herb", "mushroom", "tofu", "bread", "bagel", "banana", "deli", "scallion", "green onion", "asparagus"]],
  [14, ["sour cream", "cream cheese", "greek yogurt"]],
  [7, ["milk", "cream", "half and half", "ricotta", "mozzarella", "feta", "burrata", "goat cheese", "cottage cheese", "hummus", "tomato", "cucumber", "zucchini", "bell pepper", "pepper", "eggplant", "broccoli", "cauliflower", "green bean", "corn", "pea", "bacon", "sausage", "ham", "hot dog", "salsa", "pesto", "tempeh"]],
  [14, ["yogurt", "sour cream", "cream cheese", "carrot", "celery", "cabbage", "tortilla", "pita", "grape", "orange", "ginger", "jalapeno", "jalapeño", "brussels"]],
  [21, ["lemon", "lime", "apple", "pear", "beet", "radish"]],
  [28, ["egg", "cheddar", "parmesan", "gouda", "swiss", "cheese", "butter"]],
  [30, ["onion", "shallot", "garlic", "potato", "sweet potato", "squash", "pumpkin"]],
];

/** Things that go off even when kept in the cupboard. */
const PANTRY_PERISHABLE = /\b(bread|bagel|banana|avocado|tomato|onion|shallot|garlic|potato|squash|pumpkin|tortilla|pita|apple|orange|lemon|lime|leftover)\b/;

/** Estimated days until something goes off, or null for shelf-stable things (rice, cans, spices). */
export function shelfLifeDays(name: string, storage: PantryItem["storage"]): number | null {
  if (storage === "Spices") return null;
  if (storage === "Freezer") return 90;
  const n = normalize(name);
  if (storage === "Pantry" && !PANTRY_PERISHABLE.test(n)) return null; // cans, grains, jars
  const has = (w: string) => { const k = normalize(w); return !!k && new RegExp(`\\b${k}\\b`).test(n); };
  for (const [days, words] of SHELF_LIFE) if (words.some(has)) return days;
  return storage === "Fridge" ? 7 : null;
}

export function estimateExpiry(name: string, storage: PantryItem["storage"]): string | null {
  const days = shelfLifeDays(name, storage);
  return days === null ? null : isoDay(addDays(new Date(), days));
}

/** Perishables, most urgent first, as "spinach (2 days left)" for Claude. */
export function perishablesForClaude(items: PantryItem[], withinDays = 10): string[] {
  return items
    .filter((p) => p.storage !== "Spices" && p.storage !== "Freezer")
    .map((p) => ({ p, d: daysUntil(p.expires_on) }))
    .filter((x): x is { p: PantryItem; d: number } => x.d !== null && x.d <= withinDays)
    .sort((a, b) => a.d - b.d)
    .map(({ p, d }) => `${withQty(p)}: ${d < 0 ? "past its date, check it" : d === 0 ? "use today" : `${d} day${d === 1 ? "" : "s"} left`}`);
}

/* ---------------- Quantities ("6 eggs", "1 lb chicken meatballs", "eggs x12") ---------------- */

const UNITS = "cups?|tbsps?|tablespoons?|tsps?|teaspoons?|g|grams?|kg|ml|l|liters?|oz|ounces?|lbs?|pounds?|cloves?|cans?|pinch(?:es)?|bunch(?:es)?|slices?|pieces?|handfuls?|packs?|packages?|blocks?|dozen|bags?|boxes?|bottles?|jars?|heads?|containers?|cartons?|pints?|quarts?|gallons?|sticks?|loaf|loaves|fillets?|stalks?|sprigs?|tubs?";
export const LEADING_QTY = new RegExp(`^((?:[\\d½¼¾⅓⅔/.\\-–]+\\s*)+(?:(?:${UNITS})\\b)?\\.?)\\s+(.+)$`, "i");
const WORD_QTY = new RegExp(`^(an?|half an?|half)\\s+(${UNITS})\\b\\s*(?:of\\s+)?(.+)$`, "i");
const TRAILING_QTY = /^(.+?)\s*(?:[x×]\s*(\d+(?:\.\d+)?)|\(\s*([^)]+)\s*\)|[-–:]\s*(\d[\w\s./]*))$/i;

/** Splits "6 eggs" → { name: "eggs", qty: "6" }. No amount → qty null. */
export function parseQuantity(input: string): { name: string; qty: string | null } {
  const s = input.trim().replace(/\s+/g, " ");
  let m = s.match(LEADING_QTY);
  if (m) return { name: m[2].trim(), qty: m[1].trim() };
  m = s.match(WORD_QTY);
  if (m) return { name: m[3].trim(), qty: `${/^half/i.test(m[1]) ? "½" : "1"} ${m[2]}` };
  m = s.match(TRAILING_QTY);
  if (m) return { name: m[1].trim(), qty: (m[2] ?? m[3] ?? m[4]).trim() };
  return { name: s, qty: null };
}

/** "Eggs (6)" for Claude; just the name when there's no amount. */
export function withQty(p: Pick<PantryItem, "name" | "qty">) {
  return p.qty ? `${p.name} (${p.qty})` : p.name;
}
