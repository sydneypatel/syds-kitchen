import { useState } from "react";
import { Button, Empty, Header, Icon, Page, Title, toast } from "../components/ui";
import { daysUntil } from "../lib/food";
import { useStore } from "../lib/store";
import { STORAGES, type PantryItem, type Storage } from "../lib/types";

const STORAGE_ICON: Record<Storage, string> = { Fridge: "ingredients", Freezer: "snow", Pantry: "recipes" };

function ExpiryChip({ item }: { item: PantryItem }) {
  const { updatePantry } = useStore();
  const d = daysUntil(item.expires_on);
  const tone = d === null ? "text-muted bg-cream" : d < 0 ? "bg-coral text-white" : d <= 3 ? "bg-[#fff2ec] text-[#a53f28]" : "bg-sage text-forest";
  const label = d === null ? "Add date" : d < 0 ? "Expired" : d === 0 ? "Today" : d === 1 ? "Tomorrow" : `${d} days`;
  return <label className={`relative cursor-pointer rounded-full px-2.5 py-1 text-[.65rem] font-bold ${tone}`} title="Use-by date">
    {label}
    <input type="date" aria-label={`Use-by date for ${item.name}`} value={item.expires_on ?? ""} onChange={(e) => updatePantry(item.id, { expires_on: e.target.value || null })} className="absolute inset-0 cursor-pointer opacity-0" />
  </label>;
}

export function Ingredients() {
  const { pantry_items, shopping_items, addPantry, removePantry } = useStore();
  const [draft, setDraft] = useState("");
  const [storage, setStorage] = useState<Storage | "Auto">("Auto");
  const toBuy = shopping_items.filter((s) => !s.checked).length;

  const add = () => {
    const names = draft.split(/,|\n/).map((s) => s.trim()).filter(Boolean);
    names.forEach((n) => addPantry(n, storage === "Auto" ? undefined : storage));
    if (names.length > 1) toast(`Added ${names.length} ingredients`);
    setDraft("");
  };

  const groups = STORAGES.map((s) => ({ s, items: pantry_items.filter((p) => p.storage === s).sort((a, b) => (daysUntil(a.expires_on) ?? 999) - (daysUntil(b.expires_on) ?? 999)) }));

  return <main>
    <Header title="Ingredients" right={<a href="#/shopping" aria-label="Open shopping list" className="relative icon-btn lg:hidden"><Icon name="bag" />{toBuy > 0 && <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-coral text-[.6rem] text-white">{toBuy}</span>}</a>} />
    <Page>
      <Title title="What you have" copy="Keep this list current and we’ll show recipes that use it well. Tip: paste a few at once, separated by commas." />
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input className="field" placeholder="Add an ingredient (e.g. eggs, spinach, rice)" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <div className="flex gap-2">
          <select aria-label="Where it's stored" value={storage} onChange={(e) => setStorage(e.target.value as Storage | "Auto")} className="field !w-auto"><option value="Auto">Auto-sort</option>{STORAGES.map((s) => <option key={s}>{s}</option>)}</select>
          <Button onClick={add} disabled={!draft.trim()} className="!px-3.5" ><Icon name="plus" /><span className="sm:hidden lg:inline">Add</span></Button>
        </div>
      </div>

      {pantry_items.length === 0 ? <div className="mt-6"><Empty title="Your kitchen is empty" copy="Add what's in your fridge, freezer and cupboard. Recipes will show what you have and what you still need." /></div>
        : <div className="mt-6 grid gap-5 lg:grid-cols-3">{groups.map(({ s, items }) => <section key={s}>
          <div className="mb-2 flex items-center justify-between px-1"><h2 className="font-display text-xl">{s}</h2><span className="text-[.65rem] font-bold uppercase tracking-widest text-muted">{items.length} {items.length === 1 ? "item" : "items"}</span></div>
          <div className="card">{items.length ? items.map((item, i) => <div key={item.id} className={`flex items-center gap-3 px-4 py-3.5 ${i ? "border-t border-line" : ""}`}>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sage text-forest"><Icon name={STORAGE_ICON[s]} size={17} /></span>
            <span className="min-w-0 flex-1 truncate font-semibold">{item.name}</span>
            <ExpiryChip item={item} />
            <button aria-label={`Remove ${item.name}`} onClick={() => removePantry([item.id])} className="text-muted hover:text-coral"><Icon name="close" size={17} /></button>
          </div>) : <p className="px-4 py-5 text-sm text-muted">Nothing here.</p>}</div>
        </section>)}</div>}

      <section className="mt-8 rounded-3xl bg-sand p-5 lg:max-w-xl"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-coral"><Icon name="bag" /></span><div><h2 className="font-display text-xl">Needed for your recipes</h2><p className="mt-1 text-sm leading-5 text-muted">{toBuy ? `${toBuy} ingredient${toBuy === 1 ? " is" : "s are"} waiting in your shopping list.` : "Your shopping list is clear."}</p></div></div><a href="#/shopping" className="btn btn-secondary mt-5 w-full justify-center">View shopping list <Icon name="arrow" size={16} /></a></section>
    </Page>
  </main>;
}
