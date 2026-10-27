// POST /api/import — turn a recipe link or pasted text into form fields.
// 1) Links: read the schema.org "Recipe" data most recipe sites embed (free, no AI).
// 2) Otherwise (TikTok/Instagram captions, blogs without it, your own notes): ask Claude to extract it.
// Used by Vercel directly and by the Vite dev server (vite.config.ts).
// Kept self-contained (no shared imports) so Vercel's per-file function build stays simple.

type Env = Record<string, string | undefined>;

export type ImportedRecipe = {
  title: string;
  description: string;
  image: string | null;
  prep: number | null;
  cook: number | null;
  clean: number | null;
  servings: number | null;
  ingredients: string[]; // one line each, e.g. "1 cup brown rice"
  steps: string[];
  tags: string[];
  source_url: string | null;
  via: "page-data" | "claude";
};

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function verifyUser(request: Request, env: Env): Promise<boolean> {
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const anon = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!supabaseUrl || !anon || !token) return false;
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
  if (!res.ok) return false;
  const user = (await res.json()) as { email?: string };
  const allowed = (env.ALLOWED_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return !allowed.length || allowed.includes((user.email || "").toLowerCase());
}

/* ---------------- Page parsing (no AI) ---------------- */

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
const clean = (s: unknown) => (typeof s === "string" ? decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim() : "");

/** ISO 8601 duration ("PT1H15M") → minutes. */
export function minutes(iso: unknown): number | null {
  if (typeof iso !== "string") return null;
  const m = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!m) return null;
  const total = Number(m[1] || 0) * 1440 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
  return total || null;
}

function findRecipe(node: unknown): Record<string, unknown> | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const r = findRecipe(n);
      if (r) return r;
    }
    return null;
  }
  const o = node as Record<string, unknown>;
  const type = o["@type"];
  if (type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))) return o;
  return findRecipe(o["@graph"]) ?? findRecipe(o.mainEntity) ?? null;
}

function steps(instr: unknown): string[] {
  if (!instr) return [];
  if (typeof instr === "string") return instr.split(/\n+|(?<=\.)\s+(?=[A-Z])/).map(clean).filter(Boolean);
  if (Array.isArray(instr)) return instr.flatMap((s) => steps(s));
  const o = instr as Record<string, unknown>;
  if (o.itemListElement) return steps(o.itemListElement); // HowToSection
  return [clean(o.text ?? o.name)].filter(Boolean); // HowToStep
}

function imageUrl(img: unknown): string | null {
  if (!img) return null;
  if (typeof img === "string") return img;
  if (Array.isArray(img)) return imageUrl(img[0]);
  const o = img as Record<string, unknown>;
  return typeof o.url === "string" ? o.url : null;
}

/** Pulls the schema.org Recipe out of a page's JSON-LD, if it has one. */
export function parseRecipeHtml(html: string, url: string | null): ImportedRecipe | null {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [, body] of blocks) {
    let data: unknown;
    try {
      data = JSON.parse(body.trim());
    } catch {
      continue;
    }
    const r = findRecipe(data);
    if (!r) continue;
    const ingredients = (Array.isArray(r.recipeIngredient) ? r.recipeIngredient : []).map(clean).filter(Boolean);
    if (!r.name || !ingredients.length) continue;
    const yieldRaw = Array.isArray(r.recipeYield) ? r.recipeYield[0] : r.recipeYield;
    const servings = Number(String(yieldRaw ?? "").match(/\d+/)?.[0]) || null;
    const asList = (v: unknown) => (Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : []).map(clean).filter(Boolean);
    const tags = [...new Set([...asList(r.recipeCuisine), ...asList(r.recipeCategory), ...asList(r.keywords).slice(0, 4)])].slice(0, 6);
    let prep = minutes(r.prepTime);
    let cook = minutes(r.cookTime);
    const total = minutes(r.totalTime);
    if (total && !prep && !cook) cook = total;
    else if (total && prep && !cook) cook = Math.max(total - prep, 0) || null;
    else if (total && cook && !prep) prep = Math.max(total - cook, 0) || null;
    const desc = clean(r.description);
    return {
      title: clean(r.name),
      description: desc.length > 120 ? desc.slice(0, 117).replace(/\s+\S*$/, "") + "…" : desc,
      image: imageUrl(r.image),
      prep,
      cook,
      clean: null,
      servings,
      ingredients,
      steps: steps(r.recipeInstructions),
      tags,
      source_url: url,
      via: "page-data",
    };
  }
  return null;
}

/** Readable text from a page for Claude: social captions (og:description) + body text. */
function pageText(html: string) {
  const meta = (name: string) => html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']*)["']`, "i"))?.[1] ?? "";
  const body = html
    .replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|li|h\d|div)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return [meta("og:title"), meta("og:description"), meta("description"), decode(body)]
    .map((s) => decode(s).replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, 15000);
}

function ogImage(html: string) {
  return html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null;
}

/* ---------------- Claude extraction ---------------- */

const extractTool = {
  name: "return_recipe",
  description: "Return the recipe found in the text.",
  input_schema: {
    type: "object",
    properties: {
      found: { type: "boolean", description: "False if the text contains no recipe" },
      title: { type: "string" },
      description: { type: "string", description: "One short line, under 70 characters" },
      prep: { type: "integer", description: "Prep minutes; estimate if not stated" },
      cook: { type: "integer", description: "Cook minutes; estimate if not stated" },
      clean: { type: "integer", description: "Cleanup minutes; estimate (usually 5-15)" },
      servings: { type: "integer" },
      ingredients: { type: "array", items: { type: "string" }, description: "One per line with amount first, e.g. '1 cup brown rice'. Keep the author's amounts." },
      steps: { type: "array", items: { type: "string" }, description: "Concise steps in order" },
      tags: { type: "array", items: { type: "string" }, description: "Up to 4, e.g. Vegetarian, High protein, Meal prep, cuisine" },
    },
    required: ["found", "title", "description", "prep", "cook", "clean", "servings", "ingredients", "steps", "tags"],
  },
};

async function extractWithClaude(text: string, env: Env): Promise<Omit<ImportedRecipe, "image" | "source_url" | "via"> | null> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: 3000,
      tools: [extractTool],
      tool_choice: { type: "tool", name: "return_recipe" },
      messages: [{ role: "user", content: `Extract the recipe from this text so it can fill in a recipe form. If it's loose notes, tidy them into clear ingredients and steps without inventing extra ingredients.\n\n<text>\n${text}\n</text>` }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API error (${res.status})`);
  const data = (await res.json()) as { content: { type: string; input?: Record<string, unknown> }[] };
  const r = data.content.find((c) => c.type === "tool_use")?.input;
  if (!r || r.found === false) return null;
  return {
    title: String(r.title ?? ""),
    description: String(r.description ?? ""),
    prep: Number(r.prep) || null,
    cook: Number(r.cook) || null,
    clean: Number(r.clean) || null,
    servings: Number(r.servings) || null,
    ingredients: (r.ingredients as string[]) ?? [],
    steps: (r.steps as string[]) ?? [],
    tags: (r.tags as string[]) ?? [],
  };
}

function safeUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (!/^https?:$/.test(u.protocol)) return null;
    if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[?::1)/.test(u.hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(u.hostname)) return null;
    return u;
  } catch {
    return null;
  }
}

export async function handleImport(request: Request, env: Env, opts: { skipAuth?: boolean } = {}): Promise<Response> {
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });
  if (!opts.skipAuth && !(await verifyUser(request, env))) return json(401, { error: "Sign in to import recipes." });

  let body: { url?: string; text?: string };
  try {
    body = (await request.json()) as { url?: string; text?: string };
  } catch {
    return json(400, { error: "Bad request" });
  }

  const needClaude = () => (env.ANTHROPIC_API_KEY ? null : json(500, { error: "ANTHROPIC_API_KEY isn't set, so only links with built-in recipe data can be imported." }));

  try {
    if (body.url) {
      const url = safeUrl(body.url.trim());
      if (!url) return json(400, { error: "That doesn't look like a web link." });
      let html = "";
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15", Accept: "text/html" },
          redirect: "follow",
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) html = (await res.text()).slice(0, 3_000_000);
      } catch {
        /* fall through */
      }
      if (!html) return json(422, { error: "Couldn't open that link (some sites block apps). Copy the recipe text and paste it instead." });

      const fromPage = parseRecipeHtml(html, url.href);
      if (fromPage) return json(200, { recipe: fromPage });

      const missing = needClaude();
      if (missing) return missing;
      const text = pageText(html);
      const r = text.length > 40 ? await extractWithClaude(text, env) : null;
      if (!r) return json(422, { error: "Couldn't find a recipe on that page. Try pasting the recipe text instead." });
      return json(200, { recipe: { ...r, image: ogImage(html), source_url: url.href, via: "claude" } satisfies ImportedRecipe });
    }

    const text = (body.text ?? "").trim();
    if (text.length < 15) return json(400, { error: "Paste a link or a bit more recipe text." });
    const missing = needClaude();
    if (missing) return missing;
    const r = await extractWithClaude(text.slice(0, 15000), env);
    if (!r) return json(422, { error: "Couldn't find a recipe in that text." });
    return json(200, { recipe: { ...r, image: null, source_url: null, via: "claude" } satisfies ImportedRecipe });
  } catch (e) {
    return json(502, { error: (e as Error).message || "Import failed. Try again." });
  }
}

// Vercel serverless function
export async function POST(request: Request) {
  return handleImport(request, process.env);
}
