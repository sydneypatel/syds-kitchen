import { useState } from "react";
import { RecipeCard } from "../components/RecipeCard";
import { Empty, Header, Icon, Page, Title } from "../components/ui";
import { missingFor, totalMinutes } from "../lib/food";
import { useStore } from "../lib/store";

const FILTERS = ["All", "Everything on hand", "Under 30 min", "Vegetarian", "Meal prep", "My recipes", "Claude ideas", "TheMealDB"] as const;

export function Recipes() {
  const { recipes, pantry_items, profile } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [q, setQ] = useState("");

  const hasTag = (tags: string[], t: string) => tags.some((x) => x.toLowerCase().includes(t));
  const shown = recipes.filter((r) => {
    if (q && !`${r.title} ${r.description} ${r.ingredients.map((i) => i.name).join(" ")} ${r.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
    switch (filter) {
      case "Everything on hand": return missingFor(r, pantry_items).length === 0;
      case "Under 30 min": return totalMinutes(r, profile.eat_minutes) <= 30;
      case "Vegetarian": return hasTag(r.tags, "vegetarian") || hasTag(r.tags, "vegan");
      case "Meal prep": return hasTag(r.tags, "prep") || hasTag(r.tags, "batch") || hasTag(r.tags, "leftover");
      case "My recipes": return r.source === "manual";
      case "Claude ideas": return r.source === "ai";
      case "TheMealDB": return r.source === "mealdb";
      default: return true;
    }
  });

  return <main>
    <Header title="Recipes" right={<a href="#/new" aria-label="New recipe" className="icon-btn lg:hidden"><Icon name="plus" /></a>} />
    <Page>
      <Title title="Cook with what you have" copy="Each recipe shows what’s ready and what you’ll still need." right={<div className="flex gap-2"><a href="#/browse" className="btn btn-secondary"><Icon name="globe" size={16} /> Browse TheMealDB</a><a href="#/new" className="btn btn-primary max-lg:hidden"><Icon name="plus" size={16} /> New recipe</a></div>} />
      <div className="mt-5 flex items-center gap-2 rounded-2xl border border-line bg-white px-3.5 lg:max-w-md"><Icon name="search" size={17} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search recipes or ingredients" className="w-full bg-transparent py-3 text-sm outline-none" /></div>
      <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0">{FILTERS.map((x) => <button key={x} onClick={() => setFilter(x)} className={`chip ${filter === x ? "chip-active" : ""}`}>{x}</button>)}</div>
      {shown.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{shown.map((r) => <RecipeCard key={r.id} recipe={r} />)}</div>
        : <div className="mt-6"><Empty title={recipes.length ? "No matches" : "No recipes yet"} copy={recipes.length ? "Try a different filter or search." : "Add one you already make, browse TheMealDB, or ask Claude from the Home screen."} action={!recipes.length ? <a href="#/new" className="btn btn-primary"><Icon name="plus" size={16} /> Add a recipe</a> : undefined} /></div>}
    </Page>
  </main>;
}
