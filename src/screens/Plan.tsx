import { useState } from "react";
import { Button, Empty, Header, Icon, Page, RecipeImage, Sheet, Title, toast } from "../components/ui";
import { addDays, isoDay, missingFor, startOfWeek, totalMinutes } from "../lib/food";
import { useStore } from "../lib/store";

export function Plan() {
  const { plan_entries, recipes, pantry_items, addPlan, removePlan, addShopping } = useStore();
  const [offset, setOffset] = useState(0);
  const [pickDay, setPickDay] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const start = addDays(startOfWeek(new Date()), offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const todayIso = isoDay(new Date());
  const isos = days.map(isoDay);
  const week = plan_entries.filter((p) => isos.includes(p.day));
  const weekRecipes = [...new Set(week.map((p) => p.recipe_id))].map((id) => recipes.find((r) => r.id === id)).filter((r) => !!r);
  const missing = [...new Set(weekRecipes.flatMap((r) => missingFor(r, pantry_items)))];
  const cookMinutes = weekRecipes.reduce((s, r) => s + totalMinutes(r), 0);
  const portions = week.reduce((s, p) => s + p.servings, 0);

  const range = `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${addDays(start, 6).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  const pickList = recipes.filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()));

  return <main>
    <Header title="Plan" />
    <Page>
      <Title eyebrow="Meal prep" title="Plan your week" copy="Put recipes on days, then build one shopping list for all of it. Cook once on prep day, eat all week." right={<div className="flex items-center gap-1 rounded-full border border-line bg-white p-1"><button aria-label="Previous week" onClick={() => setOffset(offset - 1)} className="icon-btn"><Icon name="back" size={18} /></button><button onClick={() => setOffset(0)} className="min-w-32 px-2 text-center text-xs font-bold">{offset === 0 ? "This week" : range}</button><button aria-label="Next week" onClick={() => setOffset(offset + 1)} className="icon-btn"><Icon name="arrow" size={18} /></button></div>} />

      <section className="mt-6 grid gap-4 rounded-[1.75rem] bg-forest p-5 text-white lg:grid-cols-[1fr_auto] lg:items-center lg:p-7">
        <div className="grid grid-cols-3 gap-3">
          <div><div className="font-display text-4xl">{weekRecipes.length}</div><div className="text-xs text-white/60">recipes to prep</div></div>
          <div><div className="font-display text-4xl">{portions}</div><div className="text-xs text-white/60">portions planned</div></div>
          <div><div className="font-display text-4xl">{Math.round(cookMinutes / 6) / 10}<span className="text-xl">h</span></div><div className="text-xs text-white/60">total cook time</div></div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Button variant="coral" disabled={!missing.length} onClick={() => { const n = addShopping(missing); toast(n ? `Added ${n} item${n === 1 ? "" : "s"} to your shopping list` : "Everything's already on your list"); }} className="justify-center"><Icon name="bag" size={16} /> {missing.length ? `Shop for the week (${missing.length})` : "You have everything"}</Button>
          <a href="#/shopping" className="btn justify-center border border-white/20 text-white">Open shopping list</a>
        </div>
      </section>

      <div className="mt-6 grid gap-3 xl:grid-cols-7">
        {days.map((d, i) => {
          const iso = isos[i];
          const entries = week.filter((p) => p.day === iso);
          const isToday = iso === todayIso;
          return <section key={iso} className={`rounded-3xl p-3 ${isToday ? "bg-white shadow-soft ring-2 ring-coral/40" : "bg-white/70"}`}>
            <div className="flex items-center justify-between px-1 xl:flex-col xl:items-start"><div className="flex items-baseline gap-2"><span className={`text-[.65rem] font-bold uppercase tracking-widest ${isToday ? "text-coral" : "text-muted"}`}>{d.toLocaleDateString(undefined, { weekday: "short" })}</span><span className="font-display text-xl">{d.getDate()}</span></div>
              <button onClick={() => setPickDay(iso)} aria-label={`Add a recipe on ${d.toDateString()}`} className="flex items-center gap-1 text-xs font-bold text-coral xl:hidden"><Icon name="plus" size={14} /> Add</button></div>
            <div className="mt-2 space-y-2">{entries.map((p) => { const r = recipes.find((x) => x.id === p.recipe_id); if (!r) return null; return <div key={p.id} className="group relative overflow-hidden rounded-2xl border border-line bg-cream"><a href={`#/recipe/${r.id}`} className="flex items-center gap-3 p-2 xl:block xl:p-0"><RecipeImage src={r.image} title="" className="size-12 shrink-0 rounded-xl xl:h-16 xl:w-full xl:rounded-none" /><span className="min-w-0 flex-1 xl:block xl:p-2.5"><span className="block truncate text-sm font-bold xl:whitespace-normal xl:text-xs">{r.title}</span><span className="text-[.65rem] text-muted">{totalMinutes(r)} min · {p.servings} portion{p.servings === 1 ? "" : "s"}</span></span></a><button aria-label={`Remove ${r.title}`} onClick={() => removePlan(p.id)} className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-muted hover:text-coral xl:top-2 xl:translate-y-0"><Icon name="close" size={14} /></button></div>; })}</div>
            <button onClick={() => setPickDay(iso)} className="mt-2 hidden w-full items-center justify-center gap-1 rounded-2xl border border-dashed border-line py-2.5 text-xs font-bold text-muted hover:border-coral hover:text-coral xl:flex"><Icon name="plus" size={14} /> Add</button>
          </section>;
        })}
      </div>
    </Page>

    <Sheet open={!!pickDay} onClose={() => { setPickDay(null); setQ(""); }} title="Choose a recipe" subtitle={pickDay ? new Date(pickDay + "T00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) : ""}>
      {recipes.length ? <>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your recipes" className="field mt-5" />
        <div className="mt-3 max-h-[50dvh] space-y-2 overflow-y-auto">{pickList.map((r) => <button key={r.id} onClick={() => { addPlan(pickDay!, r.id); setPickDay(null); setQ(""); }} className="flex w-full items-center gap-3 rounded-2xl bg-white p-2 text-left hover:ring-2 hover:ring-coral/30"><RecipeImage src={r.image} title="" className="size-12 shrink-0 rounded-xl" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{r.title}</span><span className="text-xs text-muted">{totalMinutes(r)} min · {missingFor(r, pantry_items).length ? `need ${missingFor(r, pantry_items).length}` : "have everything"}</span></span><Icon name="plus" size={18} /></button>)}</div>
      </> : <div className="mt-5"><Empty title="No saved recipes yet" copy="Save a recipe first, then plan it here." action={<a href="#/browse" onClick={() => setPickDay(null)} className="btn btn-primary">Find recipes</a>} /></div>}
    </Sheet>
  </main>;
}
