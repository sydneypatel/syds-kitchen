import { useState } from "react";
import { Button, Header, Icon, Page, Title, toast } from "../components/ui";
import { navigate } from "../lib/router";
import { importRecipe } from "../lib/sources";
import { useStore } from "../lib/store";
import type { Ingredient, RecipeDraft } from "../lib/types";

const QTY = /^((?:[\d½¼¾⅓⅔/.\-–]+\s*)+(?:cups?|tbsps?|tablespoons?|tsps?|teaspoons?|g|grams?|kg|ml|l|oz|ounces?|lbs?|pounds?|cloves?|cans?|pinch(?:es)?|bunch(?:es)?|slices?|pieces?|handfuls?|packs?|blocks?)?\.?)\s+(.+)$/i;

function parseIngredients(text: string): Ingredient[] {
  return text.split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean).map((line) => {
    const m = line.match(QTY);
    return m ? { name: m[2].trim().toLowerCase(), qty: m[1].trim() } : { name: line.toLowerCase() };
  });
}

/** Paste a link or your own notes; fills in the form below for you to check. */
function ImportBox({ onFill }: { onFill: (r: Awaited<ReturnType<typeof importRecipe>>) => void }) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isUrl = /^https?:\/\/\S+$/i.test(input.trim());

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await importRecipe(input);
      onFill(r);
      setInput("");
      toast(r.via === "page-data" ? "Filled in from the recipe page. Give it a quick check" : "Filled in by Claude. Give it a quick check");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return <section className="mt-7 rounded-[1.75rem] bg-forest p-5 text-white lg:p-7">
    <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-mint"><Icon name="sparkle" /></span><div><h2 className="font-display text-2xl">Paste it, we’ll fill it in</h2><p className="mt-1 text-sm leading-5 text-white/65">A recipe link (blogs, NYT Cooking, TikTok or Instagram captions) or anything you’ve written down: notes, a text from your mom, a screenshot’s text.</p></div></div>
    <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && input.trim() && !busy) run(); }} rows={isUrl || !input ? 2 : 6} placeholder={"https://… or paste recipe text"} className="field mt-5 resize-y !border-white/15 leading-6" />
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <Button variant="coral" onClick={run} disabled={busy || input.trim().length < 8}>{busy ? (isUrl ? "Reading the page…" : "Reading your recipe…") : <><Icon name="sparkle" size={16} /> Fill it in</>}</Button>
      <span className="text-xs text-white/50">{isUrl ? "Link detected" : input.trim() ? "Text detected · Claude will tidy it up" : "Nothing gets saved until you hit Save recipe"}</span>
    </div>
    {error && <p className="mt-3 text-sm font-semibold text-[#ffb4a2]">{error}</p>}
  </section>;
}

export function RecipeForm({ id }: { id?: string }) {
  const { recipes, saveRecipe } = useStore();
  const existing = id ? recipes.find((r) => r.id === id) : undefined;
  const [f, setF] = useState({
    title: existing?.title ?? "",
    description: existing?.description ?? "",
    image: existing?.image ?? "",
    prep: existing?.prep ?? 10,
    cook: existing?.cook ?? 20,
    clean: existing?.clean ?? 10,
    servings: existing?.servings ?? 2,
    tags: existing?.tags.join(", ") ?? "",
    ingredients: existing?.ingredients.map((i) => (i.qty ? `${i.qty} ${i.name}` : i.name)).join("\n") ?? "",
    steps: existing?.steps.join("\n") ?? "",
    source_url: existing?.source_url ?? "",
  });
  const [filled, setFilled] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const num = (k: "prep" | "cook" | "clean" | "servings") => (e: { target: { value: string } }) => setF({ ...f, [k]: Math.max(0, Number(e.target.value) || 0) });

  const fill = (r: Awaited<ReturnType<typeof importRecipe>>) => {
    setF((cur) => ({
      title: r.title || cur.title,
      description: r.description || cur.description,
      image: r.image ?? cur.image,
      prep: r.prep ?? cur.prep,
      cook: r.cook ?? cur.cook,
      clean: r.clean ?? cur.clean,
      servings: r.servings ?? cur.servings,
      tags: r.tags.length ? r.tags.join(", ") : cur.tags,
      ingredients: r.ingredients.length ? r.ingredients.join("\n") : cur.ingredients,
      steps: r.steps.length ? r.steps.join("\n") : cur.steps,
      source_url: r.source_url ?? cur.source_url,
    }));
    setFilled(true);
  };

  const save = () => {
    const draft: RecipeDraft = {
      title: f.title.trim(),
      description: f.description.trim(),
      image: f.image.trim() || null,
      prep: f.prep,
      cook: f.cook,
      clean: f.clean,
      servings: Math.max(1, f.servings),
      tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
      ingredients: parseIngredients(f.ingredients),
      steps: f.steps.split("\n").map((s) => s.replace(/^\s*\d+[.)]\s*/, "").trim()).filter(Boolean),
      source: existing?.source ?? "manual",
      source_url: f.source_url.trim() || null,
    };
    const r = saveRecipe(draft, existing?.id);
    navigate(`/recipe/${r.id}`);
  };

  return <main>
    <Header title={existing ? "Edit recipe" : "New recipe"} back={existing ? `/recipe/${existing.id}` : "/recipes"} />
    <Page className="max-w-3xl">
      <Title eyebrow={existing ? "Edit" : "Add your own"} title={existing ? existing.title : "A recipe you already love"} copy="Times feed the “How much time do you have?” slider, so a rough guess is fine." />
      {!existing && <ImportBox onFill={fill} />}
      {filled && <div className="mt-5 flex items-start gap-2 rounded-2xl bg-sage p-4 text-sm text-forest"><Icon name="check" size={18} /><span>Filled in below. Check the times and ingredients, then hit <b>Save recipe</b>.</span></div>}
      {!existing && <div className="mt-8 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted"><span className="h-px flex-1 bg-line" />{filled ? "Review" : "Or type it in"}<span className="h-px flex-1 bg-line" /></div>}
      <form className="mt-7 space-y-5" onSubmit={(e) => { e.preventDefault(); if (f.title.trim()) save(); }}>
        <label className="block"><span className="label">Name</span><input required value={f.title} onChange={set("title")} placeholder="Lemony chickpea bowl" className="field mt-2" /></label>
        <label className="block"><span className="label">Short description</span><input value={f.description} onChange={set("description")} placeholder="Creamy, bright, and full of crunch." className="field mt-2" /></label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["prep", "cook", "clean", "servings"] as const).map((k) => <label key={k} className="block"><span className="label">{k === "clean" ? "Cleanup (min)" : k === "servings" ? "Servings" : `${k[0].toUpperCase() + k.slice(1)} (min)`}</span><input type="number" min={0} value={f[k]} onChange={num(k)} className="field mt-2" /></label>)}
        </div>
        <label className="block"><span className="label">Ingredients · one per line</span><textarea value={f.ingredients} onChange={set("ingredients")} rows={Math.max(7, f.ingredients.split("\n").length + 1)} placeholder={"1 can chickpeas\n1 cup brown rice\nbaby spinach\n2 tbsp tahini"} className="field mt-2 resize-y leading-6" /></label>
        <label className="block"><span className="label">Steps · one per line</span><textarea value={f.steps} onChange={set("steps")} rows={Math.max(6, f.steps.split("\n").length * 2)} placeholder={"Crisp the chickpeas in a hot pan with olive oil and spices.\nWhisk yogurt, tahini and lemon juice.\nLayer everything and finish with dressing."} className="field mt-2 resize-y leading-6" /></label>
        <label className="block"><span className="label">Tags · comma separated</span><input value={f.tags} onChange={set("tags")} placeholder="Vegetarian, High protein, Meal prep" className="field mt-2" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="label">Photo URL (optional)</span><input value={f.image} onChange={set("image")} placeholder="https://…" className="field mt-2" /></label>
          <label className="block"><span className="label">Original recipe link (optional)</span><input value={f.source_url} onChange={set("source_url")} placeholder="https://…" className="field mt-2" /></label>
        </div>
        {f.image && <img src={f.image} alt="" className="h-40 w-full rounded-2xl object-cover sm:w-64" onError={(e) => (e.currentTarget.style.display = "none")} />}
        <Button type="submit" disabled={!f.title.trim()} className="w-full justify-center sm:w-auto"><Icon name="check" size={17} /> {existing ? "Save changes" : "Save recipe"}</Button>
      </form>
    </Page>
  </main>;
}
