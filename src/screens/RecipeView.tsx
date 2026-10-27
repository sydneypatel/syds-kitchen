import { useState } from "react";
import { PlanPicker } from "../components/PlanPicker";
import { Button, Empty, Header, Icon, PhotoButton, RecipeImage, Sheet, SourceBadge, toast } from "../components/ui";
import { uploadRecipePhoto } from "../lib/photos";
import { inPantry, missingFor, sameFood } from "../lib/food";
import { back, getDraft, navigate } from "../lib/router";
import { useStore } from "../lib/store";
import type { Recipe, RecipeDraft } from "../lib/types";

export function RecipeView({ id, draftId }: { id?: string; draftId?: string }) {
  const store = useStore();
  const saved = id ? store.recipes.find((r) => r.id === id) : undefined;
  const draft = draftId ? getDraft(draftId) : undefined;
  const recipe: (Recipe | RecipeDraft) | undefined = saved ?? draft;
  const [planOpen, setPlanOpen] = useState(false);
  const [cookedOpen, setCookedOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!recipe) return <main><Header title="Recipe" back="/recipes" /><div className="p-5"><Empty title="Recipe not found" copy="It may have been deleted, or this idea expired after a reload." action={<a href="#/recipes" className="btn btn-primary">Back to recipes</a>} /></div></main>;

  const missing = missingFor(recipe as Recipe, store.pantry_items);
  const saveDraft = () => {
    const r = store.saveRecipe(recipe as RecipeDraft);
    toast("Saved to your recipes");
    navigate(`/recipe/${r.id}`);
    return r;
  };
  const addMissing = () => {
    const n = store.addShopping(missing, undefined, saved?.id ?? null);
    toast(n ? `Added ${n} item${n === 1 ? "" : "s"} to your shopping list` : "Already on your shopping list");
  };

  const favButton = saved && <button aria-label="Favorite" onClick={() => store.updateRecipe(saved.id, { favorite: !saved.favorite })} className={`grid size-10 place-items-center rounded-full ${saved.favorite ? "bg-coral text-white" : "bg-white"}`}><Icon name="heart" /></button>;
  const addPhoto = async (file: File) => {
    if (!saved) return;
    const url = await uploadRecipePhoto(saved.id, file);
    store.updateRecipe(saved.id, { image: url });
    toast("Photo added");
  };

  return <main className="pb-8">
    {recipe.image ? <div className="lg:hidden"><div className="relative h-72"><RecipeImage src={recipe.image} title={recipe.title} className="h-72" /><div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
      <button aria-label="Go back" onClick={() => back("/recipes")} className="absolute left-4 top-5 grid size-10 place-items-center rounded-full bg-white/90"><Icon name="back" /></button>
      {saved && <button aria-label="Favorite" onClick={() => store.updateRecipe(saved.id, { favorite: !saved.favorite })} className={`absolute right-4 top-5 grid size-10 place-items-center rounded-full ${saved.favorite ? "bg-coral text-white" : "bg-white/90"}`}><Icon name="heart" /></button>}
    </div></div> : <div className="lg:hidden"><Header title="" back="/recipes" right={favButton} /></div>}
    <div className="hidden lg:block"><Header title={recipe.title} back="/recipes" right={favButton} /></div>

    <div className={`relative bg-cream px-5 pt-7 ${recipe.image ? "-mt-7 rounded-t-[2rem]" : ""} lg:mx-auto lg:mt-0 lg:max-w-6xl lg:rounded-none lg:px-10 lg:pt-10`}>
      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-10">
        <div>
          <div className="flex items-center gap-2"><SourceBadge source={recipe.source} /><span className="eyebrow">{missing.length ? `Missing ${missing.length}` : "Fits your kitchen"}</span></div>
          <h1 className="mt-3 font-display text-[2.35rem] leading-tight lg:text-[3rem]">{recipe.title}</h1>
          <p className="mt-3 leading-6 text-muted">{recipe.description}</p>
          <div className="mt-5 grid grid-cols-4 rounded-2xl bg-white p-4 text-center shadow-soft"><div><b className="block">{recipe.prep} min</b><small>Prep</small></div><div className="border-l border-line"><b className="block">{recipe.cook} min</b><small>Cook</small></div><div className="border-x border-line"><b className="block">{recipe.clean} min</b><small>Cleanup</small></div><div><b className="block">{recipe.servings}</b><small>Servings</small></div></div>
          {recipe.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{recipe.tags.map((t) => <span key={t} className="mini-tag">{t}</span>)}</div>}
          <div className="mt-5 flex flex-wrap gap-2">
            {saved ? <>
              <Button onClick={() => setPlanOpen(true)}><Icon name="calendar" size={16} /> Add to plan</Button>
              <Button variant="secondary" onClick={() => setCookedOpen(true)}><Icon name="pot" size={16} /> I made this</Button>
              {!saved.image && <PhotoButton onUpload={addPhoto} className="lg:hidden" />}
              <Button variant="secondary" onClick={() => navigate(`/recipe/${saved.id}/edit`)}><Icon name="edit" size={16} /> Edit</Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(true)} className="!text-muted"><Icon name="trash" size={16} /> Delete</Button>
            </> : <Button variant="coral" onClick={saveDraft}><Icon name="heart" size={16} /> Save to my recipes</Button>}
          </div>
        </div>
        <div className="hidden lg:block">{recipe.image
          ? <RecipeImage src={recipe.image} title={recipe.title} className="h-full max-h-80 rounded-3xl" />
          : saved && <div className="grid h-full min-h-56 place-items-center rounded-3xl border-2 border-dashed border-line p-6 text-center"><div><span className="flex justify-center text-muted"><Icon name="camera" size={28} /></span><p className="mt-2 text-sm text-muted">No photo yet. Add one after you make it.</p><PhotoButton onUpload={addPhoto} className="mt-4" /></div></div>}</div>
      </div>

      <div className="lg:grid lg:grid-cols-[380px_1fr] lg:gap-10">
        <section className="mt-8"><h2 className="font-display text-2xl">Ingredients</h2><div className="mt-3 overflow-hidden rounded-2xl bg-white">{recipe.ingredients.map((x, i) => { const need = !inPantry(x.name, store.pantry_items); return <div key={x.name + i} className={`flex items-center gap-3 p-4 ${i ? "border-t border-line" : ""}`}><span className={`grid size-6 shrink-0 place-items-center rounded-full ${need ? "border border-coral text-coral" : "bg-sage text-forest"}`}>{need ? <Icon name="plus" size={14} /> : <Icon name="check" size={14} />}</span><span className="flex-1 text-sm font-medium capitalize">{x.name}{x.qty && <span className="ml-2 font-normal normal-case text-muted">{x.qty}</span>}</span>{need && <span className="text-[.65rem] font-bold uppercase tracking-wide text-coral">Need</span>}</div>; })}</div>
          {missing.length > 0 && <Button onClick={addMissing} variant="secondary" className="mt-3 w-full justify-center"><Icon name="bag" size={17} /> Add missing items to shopping list</Button>}
        </section>
        <section className="mt-8"><h2 className="font-display text-2xl">Let’s make it</h2><div className="mt-4 space-y-5">{recipe.steps.map((step, i) => <div key={i} className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-forest text-xs font-bold text-white">{i + 1}</span><p className="pt-1 text-sm leading-6 text-muted lg:text-[.95rem]">{step}</p></div>)}</div>
          {recipe.source_url && <a href={recipe.source_url} target="_blank" rel="noreferrer" className="mt-8 flex w-full items-center justify-center gap-2 rounded-full border border-line bg-white px-5 py-3 text-sm font-bold">View original recipe <Icon name="external" size={16} /></a>}
        </section>
      </div>
    </div>

    {saved && <>
      <PlanPicker open={planOpen} onClose={() => setPlanOpen(false)} recipeId={saved.id} title={saved.title} />
      <CookedSheet open={cookedOpen} onClose={() => setCookedOpen(false)} recipe={saved} onPhoto={addPhoto} />
      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this recipe?" subtitle="It will also be removed from your plan.">
        <div className="mt-6 flex gap-2"><Button variant="secondary" onClick={() => setConfirmDelete(false)} className="flex-1 justify-center">Cancel</Button><Button variant="coral" onClick={() => { store.removeRecipe(saved.id); navigate("/recipes"); }} className="flex-1 justify-center">Delete</Button></div>
      </Sheet>
    </>}
  </main>;
}

/** After cooking, tick off what got used up so the pantry stays honest. */
function CookedSheet({ open, onClose, recipe, onPhoto }: { open: boolean; onClose: () => void; recipe: Recipe; onPhoto: (file: File) => Promise<void> }) {
  const { pantry_items, removePantry } = useStore();
  const used = pantry_items.filter((p) => recipe.ingredients.some((i) => sameFood(i.name, p.name)));
  const [picked, setPicked] = useState<string[]>([]);
  return <Sheet open={open} onClose={onClose} title="Nice work!" subtitle="Snap a photo, and tick off anything you used up.">
    <div className="mt-5 flex items-center gap-4 rounded-2xl bg-white p-3">
      {recipe.image ? <img src={recipe.image} alt="" className="size-16 shrink-0 rounded-xl object-cover" /> : <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-sage text-forest"><Icon name="camera" size={22} /></span>}
      <div className="min-w-0 flex-1"><div className="text-sm font-bold">{recipe.image ? "Photo saved" : "How did it turn out?"}</div><div className="text-xs text-muted">{recipe.image ? "Swap in your own if you like." : "Add a photo so this recipe has one."}</div></div>
      <PhotoButton onUpload={onPhoto} label={recipe.image ? "Replace" : "Add photo"} variant={recipe.image ? "secondary" : "coral"} className="!min-h-10 shrink-0 !px-3.5 !py-2" />
    </div>
    <div className="mt-5 label">Used up</div>
    {used.length ? <div className="mt-3 overflow-hidden rounded-2xl bg-white">{used.map((p, i) => { const on = picked.includes(p.id); return <button key={p.id} onClick={() => setPicked(on ? picked.filter((x) => x !== p.id) : [...picked, p.id])} className={`flex w-full items-center gap-3 p-4 text-left ${i ? "border-t border-line" : ""}`}><span className={`grid size-6 place-items-center rounded-full border ${on ? "border-coral bg-coral text-white" : "border-line"}`}>{on && <Icon name="check" size={14} />}</span><span className="text-sm font-semibold">{p.name}</span></button>; })}</div>
      : <p className="mt-3 text-sm text-muted">None of this recipe's ingredients are in your kitchen list.</p>}
    <Button onClick={() => { removePantry(picked); if (picked.length) toast(`Removed ${picked.length} from your kitchen`); setPicked([]); onClose(); }} className="mt-6 w-full justify-center">{picked.length ? `Remove ${picked.length} used up` : "Done"}</Button>
  </Sheet>;
}
