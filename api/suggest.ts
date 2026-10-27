// Shared handler for POST /api/suggest — used by Vercel (api/suggest.ts) and the Vite dev server.
// Asks Claude for recipe ideas built around what's in your kitchen. The API key never reaches the browser.

type Env = Record<string, string | undefined>;

type SuggestBody = {
  minutes?: number;
  pantry?: string[];
  staples?: string[];
  useSoon?: string[];
  eatMinutes?: number;
  count?: number;
  request?: string;
  profile?: { living?: string[]; style?: string[]; diets?: string[]; avoid?: string[]; cuisines?: string[]; kitchen?: string[]; skill?: string[]; notes?: string };
};

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const recipeTool = {
  name: "return_recipes",
  description: "Return the recipe suggestions.",
  input_schema: {
    type: "object",
    properties: {
      recipes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Short, appetizing name, sentence case" },
            description: { type: "string", description: "One short line, under 60 characters" },
            prep: { type: "integer", description: "Prep minutes" },
            cook: { type: "integer", description: "Active + passive cook minutes" },
            clean: { type: "integer", description: "Cleanup minutes" },
            servings: { type: "integer" },
            ingredients: {
              type: "array",
              items: {
                type: "object",
                properties: { name: { type: "string", description: "Plain ingredient name, e.g. 'chickpeas'" }, qty: { type: "string", description: "e.g. '1 can', '2 tbsp'" } },
                required: ["name", "qty"],
              },
            },
            steps: { type: "array", items: { type: "string" } },
            tags: { type: "array", items: { type: "string" }, description: "e.g. Vegetarian, High protein, Meal prep friendly, cuisine" },
          },
          required: ["title", "description", "prep", "cook", "clean", "servings", "ingredients", "steps", "tags"],
        },
      },
    },
    required: ["recipes"],
  },
};

async function verifyUser(request: Request, env: Env): Promise<string | null> {
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const anon = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!supabaseUrl || !anon || !token) return null;
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const user = (await res.json()) as { email?: string };
  const allowed = (env.ALLOWED_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (allowed.length && !allowed.includes((user.email || "").toLowerCase())) return null;
  return user.email || "user";
}

export async function handleSuggest(request: Request, env: Env, opts: { skipAuth?: boolean } = {}): Promise<Response> {
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });
  if (!env.ANTHROPIC_API_KEY) return json(500, { error: "ANTHROPIC_API_KEY isn't set. Add it to .env.local (local) or Vercel project settings." });
  if (!opts.skipAuth && !(await verifyUser(request, env))) return json(401, { error: "Sign in to use AI suggestions." });

  let body: SuggestBody;
  try {
    body = (await request.json()) as SuggestBody;
  } catch {
    return json(400, { error: "Bad request" });
  }

  const count = Math.min(Math.max(body.count ?? 3, 1), 5);
  const minutes = Math.min(Math.max(body.minutes ?? 45, 10), 240);
  const eat = body.eatMinutes ?? 15;
  const p = body.profile ?? {};
  const list = (xs?: string[]) => (xs && xs.length ? xs.join(", ") : "none given");

  const prompt = [
    `Suggest ${count} recipes for a home cook. Follow their kitchen setup and notes below.`,
    `Time budget: ${minutes} minutes total, which includes about ${eat} minutes to eat. So prep + cook + cleanup must be at most ${Math.max(minutes - eat, 10)} minutes.`,
    `Ingredients on hand (amounts in parentheses when known; don't call for more than they have): ${list(body.pantry?.slice(0, 80))}.`,
    body.staples?.length ? `Spices, sauces and oils on hand (use these for flavor; avoid calling for seasonings not on this list unless essential): ${body.staples.slice(0, 80).join(", ")}.` : "",
    body.useSoon?.length ? `Perishables by urgency (use the first ones first; build at least one idea around the most urgent): ${body.useSoon.join(", ")}.` : "",
    "Favor using up fresh produce, dairy, meat and fish before shelf-stable items like grains, cans and pasta.",
    p.living?.length ? `Living situation: ${p.living.join(", ")}. Size portions and leftovers to fit; with a shared fridge, favor compact prep that stores well.` : "",
    p.style?.length ? `Cooking style: ${p.style.join(", ")}. Match it: batch/meal-prep or leftovers → more servings that keep 3-4 days and reheat well; fresh every meal → 1-2 servings; quick meals → minimal steps.` : "",
    `Diet: ${list(p.diets)}. Avoid: ${list(p.avoid)}. Favorite cuisines: ${list(p.cuisines)}. Kitchen: ${list(p.kitchen)}. Skill: ${list(p.skill)}.`,
    p.notes ? `Other notes: ${p.notes}` : "",
    body.request ? `Specific request: ${body.request}` : "",
    "Lean on what's on hand; keep extra ingredients to a few cheap, common items. Assume salt, pepper, oil and water are available.",
    "Unless their cooking style says otherwise, prefer recipes that keep well as leftovers or meal prep. Make each suggestion distinct. Steps should be concise (3-7 steps).",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: 4000,
      tools: [recipeTool],
      tool_choice: { type: "tool", name: "return_recipes" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return json(502, { error: `Claude API error (${res.status})`, detail: text.slice(0, 500) });
  }
  const data = (await res.json()) as { content: { type: string; input?: { recipes?: unknown[] } }[] };
  const tool = data.content.find((c) => c.type === "tool_use");
  return json(200, { recipes: tool?.input?.recipes ?? [] });
}

// Vercel serverless function: POST /api/suggest
export async function POST(request: Request) {
  return handleSuggest(request, process.env);
}
