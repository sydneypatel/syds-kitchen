import { useState } from "react";
import { Button, Header, Icon, Page, Title } from "../components/ui";
import { navigate } from "../lib/router";
import { useStore } from "../lib/store";
import type { Ingredient, RecipeDraft } from "../lib/types";

const QTY = /^((?:[\d½¼¾⅓⅔/.\-–]+\s*)+(?:cups?|tbsps?|tablespoons?|tsps?|teaspoons?|g|grams?|kg|ml|l|oz|ounces?|lbs?|pounds?|cloves?|cans?|pinch(?:es)?|bunch(?:es)?|slices?|pieces?|handfuls?|packs?|blocks?)?\.?)\s+(.+)$/i;

function parseIngredients(text: string): Ingredient[] {
  return text.split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean).map((line) => {
    const m = line.match(QTY);
    return m ? { name: m[2].trim().toLowerCase(), qty: m[1].trim() } : { name: line.toLowerCase() };
  });
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
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const num = (k: "prep" | "cook" | "clean" | "servings") => (e: { target: { value: string } }) => setF({ ...f, [k]: Math.max(0, Number(e.target.value) || 0) });

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
      <form className="mt-7 space-y-5" onSubmit={(e) => { e.preventDefault(); if (f.title.trim()) save(); }}>
        <label className="block"><span className="label">Name</span><input required value={f.title} onChange={set("title")} placeholder="Lemony chickpea bowl" className="field mt-2" /></label>
        <label className="block"><span className="label">Short description</span><input value={f.description} onChange={set("description")} placeholder="Creamy, bright, and full of crunch." className="field mt-2" /></label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["prep", "cook", "clean", "servings"] as const).map((k) => <label key={k} className="block"><span className="label">{k === "clean" ? "Cleanup (min)" : k === "servings" ? "Servings" : `${k[0].toUpperCase() + k.slice(1)} (min)`}</span><input type="number" min={0} value={f[k]} onChange={num(k)} className="field mt-2" /></label>)}
        </div>
        <label className="block"><span className="label">Ingredients · one per line</span><textarea value={f.ingredients} onChange={set("ingredients")} rows={7} placeholder={"1 can chickpeas\n1 cup brown rice\nbaby spinach\n2 tbsp tahini"} className="field mt-2 resize-y leading-6" /></label>
        <label className="block"><span className="label">Steps · one per line</span><textarea value={f.steps} onChange={set("steps")} rows={6} placeholder={"Crisp the chickpeas in a hot pan with olive oil and spices.\nWhisk yogurt, tahini and lemon juice.\nLayer everything and finish with dressing."} className="field mt-2 resize-y leading-6" /></label>
        <label className="block"><span className="label">Tags · comma separated</span><input value={f.tags} onChange={set("tags")} placeholder="Vegetarian, High protein, Meal prep" className="field mt-2" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="label">Photo URL (optional)</span><input value={f.image} onChange={set("image")} placeholder="https://…" className="field mt-2" /></label>
          <label className="block"><span className="label">Original recipe link (optional)</span><input value={f.source_url} onChange={set("source_url")} placeholder="https://…" className="field mt-2" /></label>
        </div>
        <Button type="submit" disabled={!f.title.trim()} className="w-full justify-center sm:w-auto"><Icon name="check" size={17} /> {existing ? "Save changes" : "Save recipe"}</Button>
      </form>
    </Page>
  </main>;
}
