import { useState } from "react";
import { Empty, Header, Page, RecipeImage, Title, toast } from "../components/ui";
import { totalMinutes } from "../lib/food";
import { useStore } from "../lib/store";
import type { Recipe } from "../lib/types";

function FavoriteCard({ recipe }: { recipe: Recipe }) {
  const { updateRecipe, profile } = useStore();
  const [rating, setRating] = useState(recipe.rating ?? 5);
  const [note, setNote] = useState(recipe.notes);
  const dirty = note !== recipe.notes;
  return <article className="card">
    {recipe.image && <a href={`#/recipe/${recipe.id}`} className="relative block"><RecipeImage src={recipe.image} title={recipe.title} className="h-36" /><span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold">{totalMinutes(recipe, profile.eat_minutes)} min</span></a>}
    <div className="p-4">
      <div className="flex items-start justify-between gap-3"><a href={`#/recipe/${recipe.id}`} className="font-display text-xl leading-tight">{recipe.title}</a>{!recipe.image && <span className="shrink-0 rounded-full bg-sand px-3 py-1 text-xs font-bold">{totalMinutes(recipe, profile.eat_minutes)} min</span>}</div>
      <div className="mt-4 flex items-center gap-3"><span className="text-xs font-bold text-muted">Your rating</span><input aria-label={`Rating for ${recipe.title}`} type="range" min="1" max="10" value={rating} onChange={(e) => setRating(Number(e.target.value))} onPointerUp={() => updateRecipe(recipe.id, { rating })} onKeyUp={() => updateRecipe(recipe.id, { rating })} className="rating-range" /><span className="grid size-8 place-items-center rounded-full bg-sand text-xs font-bold">{rating}</span></div>
      <textarea aria-label={`Notes for ${recipe.title}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for next time..." className="note-field mt-4" />
      <button disabled={!dirty} onClick={() => { updateRecipe(recipe.id, { notes: note }); toast("Note saved"); }} className="mt-3 text-xs font-bold text-coral disabled:text-muted">{dirty ? "Save note" : recipe.notes ? "Saved" : "Save note"}</button>
    </div>
  </article>;
}

export function Favorites() {
  const { recipes } = useStore();
  const list = recipes.filter((r) => r.favorite).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return <main>
    <Header title="Favorites" />
    <Page>
      <Title title="Your recipe shelf" copy="Save your favorites, add a note, and remember how much you loved them." />
      {list.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{list.map((r) => <FavoriteCard key={r.id} recipe={r} />)}</div>
        : <div className="mt-6"><Empty title="No favorites yet" copy="Tap the heart on any recipe to keep it on your shelf." action={<a href="#/recipes" className="btn btn-primary">Go to recipes</a>} /></div>}
    </Page>
  </main>;
}
