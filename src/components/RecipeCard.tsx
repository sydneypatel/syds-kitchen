import { missingFor, totalMinutes } from "../lib/food";
import { navigate } from "../lib/router";
import { useStore } from "../lib/store";
import type { Recipe, RecipeDraft } from "../lib/types";
import { Icon, RecipeImage, SourceBadge } from "./ui";

/** "Meal options" card from the Figma: photo (if any), title, time pill, prep/cook/eat/clean strip, what you still need. */
export function TimingCard({ recipe, href, cta = "Choose meal" }: { recipe: Recipe | (RecipeDraft & { id?: string }); href: string; cta?: string }) {
  const { pantry_items, profile } = useStore();
  const missing = missingFor(recipe as Recipe, pantry_items);
  const eat = profile.eat_minutes;
  return <a href={href} className="card block text-left transition-transform hover:-translate-y-0.5">
    {recipe.image && <div className="relative"><RecipeImage src={recipe.image} title={recipe.title} className="h-40" /><span className="absolute left-3 top-3"><SourceBadge source={recipe.source} /></span></div>}
    <span className="block p-5">
      {!recipe.image && <span className="mb-3 block [&>span]:bg-sage"><SourceBadge source={recipe.source} /></span>}
      <span className="flex items-start justify-between gap-3"><span className="font-display text-2xl leading-tight">{recipe.title}</span><span className="shrink-0 rounded-full bg-sage px-2.5 py-1 text-xs font-bold text-forest">{totalMinutes(recipe, eat)} min</span></span>
      <span className="mt-2 block text-sm text-muted">{recipe.description}</span>
      <span className="mt-4 grid grid-cols-4 gap-1 rounded-xl bg-cream p-3 text-center"><span><b className="block text-xs">{recipe.prep}m</b><small>Prep</small></span><span><b className="block text-xs">{recipe.cook}m</b><small>Cook</small></span><span><b className="block text-xs">{eat}m</b><small>Eat</small></span><span><b className="block text-xs">{recipe.clean}m</b><small>Clean</small></span></span>
      <span className="mt-4 flex items-center justify-between gap-3 text-xs"><span className="line-clamp-1 text-muted">{missing.length ? `Need ${missing.join(", ")}` : "You have everything"}</span><span className="shrink-0 font-bold text-coral">{cta}</span></span>
    </span>
  </a>;
}

/** Recipes-tab card from the Figma: photo with heart (or just the heart when there's no photo), title, tags, still-need line. */
export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const { pantry_items, profile, updateRecipe } = useStore();
  const missing = missingFor(recipe, pantry_items);
  const heart = (onPhoto: boolean) => <button aria-label={recipe.favorite ? "Remove from favorites" : "Add to favorites"} onClick={() => updateRecipe(recipe.id, { favorite: !recipe.favorite })} className={`grid size-10 shrink-0 place-items-center rounded-full ${recipe.favorite ? "bg-coral text-white" : onPhoto ? "bg-white/90" : "bg-cream"}`}><Icon name="heart" size={18} /></button>;
  return <article className="card flex flex-col">
    {recipe.image && <div className="relative">
      <button onClick={() => navigate(`/recipe/${recipe.id}`)} className="block w-full" aria-label={`Open ${recipe.title}`}><RecipeImage src={recipe.image} title={recipe.title} className="h-44" /></button>
      <span className="absolute left-3 top-3"><SourceBadge source={recipe.source} /></span>
      <span className="absolute right-3 top-3">{heart(true)}</span>
    </div>}
    <div className="flex flex-1 flex-col p-5">
      {!recipe.image && <div className="-mt-1 mb-3 flex items-center justify-between"><span className="[&>span]:bg-sage"><SourceBadge source={recipe.source} /></span>{heart(false)}</div>}
      <div className="flex items-start justify-between gap-3"><a href={`#/recipe/${recipe.id}`} className="font-display text-[1.35rem] leading-tight">{recipe.title}</a><span className="flex shrink-0 items-center gap-1 text-xs font-bold text-muted"><Icon name="clock" size={13} />{totalMinutes(recipe, profile.eat_minutes)} min</span></div>
      <p className="mt-2 line-clamp-2 text-sm text-muted">{recipe.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">{recipe.ingredients.slice(0, 4).map((x) => <span key={x.name} className="mini-tag">{x.name}</span>)}</div>
      <div className="flex-1" />
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4"><span className="line-clamp-1 text-xs text-muted">{missing.length ? `Still need: ${missing.join(", ")}` : "You have everything"}</span><a href={`#/recipe/${recipe.id}`} className="flex shrink-0 items-center gap-1 text-xs font-bold text-coral">Open recipe <Icon name="arrow" size={14} /></a></div>
    </div>
  </article>;
}
