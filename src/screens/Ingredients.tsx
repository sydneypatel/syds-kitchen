import { useState } from "react";
import { Button, Empty, Header, Icon, Page, Title, toast } from "../components/ui";
import { daysUntil, estimateExpiry, parseQuantity, sameFood } from "../lib/food";
import { useStore } from "../lib/store";
import { MAIN_STORAGES, STORAGES, STORAGE_LABEL, type PantryItem, type Storage } from "../lib/types";

const STORAGE_ICON: Record<Storage, string> = { Fridge: "ingredients", Freezer: "snow", Pantry: "recipes", Spices: "jar" };

/** One-tap adds for the flavor shelf. Only ones you don't already have are shown. */
const COMMON_FLAVORS = ["Salt", "Black pepper", "Olive oil", "Garlic powder", "Onion powder", "Cumin", "Paprika", "Chili flakes", "Turmeric", "Garam masala", "Oregano", "Cinnamon", "Soy sauce", "Sriracha", "Rice vinegar", "Sesame oil", "Honey", "Dijon mustard", "Hot sauce", "Chili crisp"];

/** Editable amount ("6", "1 lb", "half a bag"). Saves when you leave the box or press Enter. */
function QtyInput({ item }: { item: PantryItem }) {
  const { updatePantry } = useStore();
  const [v, setV] = useState(item.qty ?? "");
  const save = () => {
    const next = v.trim() || null;
    if (next !== (item.qty ?? null)) updatePantry(item.id, { qty: next });
  };
  return <input value={v} onChange={(e) => setV(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()} placeholder="Qty" aria-label={`Amount of ${item.name}`} className={`w-16 shrink-0 rounded-lg border px-1 py-1 text-center font-bold ${v.length > 4 ? "text-xs" : "text-sm"} outline-none focus:border-coral ${v ? "border-transparent bg-sand text-ink" : "border-dashed border-line bg-transparent text-muted"}`} />;
}

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

/** Spices, sauces & oils: shown as chips since there are usually lots and they rarely expire. */
function FlavorShelf() {
  const { pantry_items, addPantry, removePantry } = useStore();
  const [draft, setDraft] = useState("");
  const items = pantry_items.filter((p) => p.storage === "Spices").sort((a, b) => a.name.localeCompare(b.name));
  const suggestions = COMMON_FLAVORS.filter((f) => !items.some((i) => sameFood(i.name, f)));

  const add = () => {
    const names = draft.split(/,|\n/).map((s) => s.trim()).filter(Boolean);
    names.forEach((n) => addPantry(n, "Spices"));
    if (names.length > 1) toast(`Added ${names.length} to your spice shelf`);
    setDraft("");
  };

  return <section className="mt-8 rounded-[1.75rem] bg-white p-5 shadow-soft lg:p-7">
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-coral"><Icon name="jar" /></span>
      <div className="flex-1"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-2xl">Spices, sauces &amp; oils</h2><span className="text-[.65rem] font-bold uppercase tracking-widest text-muted">{items.length} {items.length === 1 ? "item" : "items"}</span></div>
        <p className="mt-1 text-sm leading-5 text-muted">Your flavor shelf. Claude builds its ideas around these, and recipes won’t list them as missing.</p></div>
    </div>
    <div className="mt-5 flex gap-2"><input className="field" placeholder="Add spices or sauces (e.g. cumin, gochujang, sesame oil)" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} /><Button onClick={add} disabled={!draft.trim()} className="!px-3.5"><Icon name="plus" /></Button></div>
    {items.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{items.map((i) => <span key={i.id} className="inline-flex items-center gap-1.5 rounded-full bg-sage py-1.5 pl-3.5 pr-2 text-sm font-semibold text-forest">{i.name}<button aria-label={`Remove ${i.name}`} onClick={() => removePantry([i.id])} className="grid size-5 place-items-center rounded-full text-forest/60 hover:bg-white hover:text-coral"><Icon name="close" size={13} /></button></span>)}</div>}
    {suggestions.length > 0 && <div className="mt-5 border-t border-line pt-4"><div className="label">Quick add</div><div className="mt-3 flex flex-wrap gap-2">{suggestions.map((f) => <button key={f} onClick={() => addPantry(f, "Spices")} className="inline-flex items-center gap-1 rounded-full border border-dashed border-line px-3 py-1.5 text-xs font-bold text-muted hover:border-coral hover:text-coral"><Icon name="plus" size={12} />{f}</button>)}</div></div>}
  </section>;
}

export function Ingredients() {
  const { pantry_items, shopping_items, addPantry, removePantry, updatePantry } = useStore();
  const [draft, setDraft] = useState("");
  const [storage, setStorage] = useState<Storage | "Auto">("Auto");
  // Items added before dates were estimated automatically, which we can still estimate.
  const undated = pantry_items.filter((p) => !p.expires_on && estimateExpiry(p.name, p.storage));
  const fillDates = () => {
    undated.forEach((p) => updatePantry(p.id, { expires_on: estimateExpiry(p.name, p.storage) }));
    toast(`Added estimated dates to ${undated.length} item${undated.length === 1 ? "" : "s"}`);
  };
  const toBuy = shopping_items.filter((s) => !s.checked).length;
  const food = pantry_items.filter((p) => p.storage !== "Spices");

  const add = () => {
    const names = draft.split(/,|\n/).map((s) => s.trim()).filter(Boolean);
    names.forEach((n) => {
      const { name, qty } = parseQuantity(n); // "6 eggs" → Eggs, qty 6
      addPantry(name, storage === "Auto" ? undefined : storage, undefined, qty);
    });
    if (names.length > 1) toast(`Added ${names.length} ingredients`);
    setDraft("");
  };

  const groups = MAIN_STORAGES.map((s) => ({ s, items: pantry_items.filter((p) => p.storage === s).sort((a, b) => (daysUntil(a.expires_on) ?? 999) - (daysUntil(b.expires_on) ?? 999)) }));

  return <main>
    <Header title="Ingredients" right={<a href="#/shopping" aria-label="Open shopping list" className="relative icon-btn lg:hidden"><Icon name="bag" />{toBuy > 0 && <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-coral text-[.6rem] text-white">{toBuy}</span>}</a>} />
    <Page>
      <Title title="What you have" copy="Keep this list current and we’ll show recipes that use it well. Fresh items get an estimated use-by date (tap it to change), so Claude uses what goes off first. Tip: paste a few at once, separated by commas." />
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input className="field" placeholder="Add with amounts, e.g. 6 eggs, 2 zucchini, 1 lb chicken meatballs" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <div className="flex gap-2">
          <select aria-label="Where it's stored" value={storage} onChange={(e) => setStorage(e.target.value as Storage | "Auto")} className="field !w-auto"><option value="Auto">Auto-sort</option>{STORAGES.map((s) => <option key={s} value={s}>{STORAGE_LABEL[s]}</option>)}</select>
          <Button onClick={add} disabled={!draft.trim()} className="!px-3.5"><Icon name="plus" /><span className="sm:hidden lg:inline">Add</span></Button>
        </div>
      </div>

      {undated.length > 0 && <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-[#fff2ec] p-4 sm:flex-row sm:items-center"><p className="flex-1 text-sm leading-5 text-[#a53f28]"><b>{undated.length} item{undated.length === 1 ? " has" : "s have"} no use-by date.</b> Add typical estimates so Claude knows what to use first? You can tweak any of them.</p><Button variant="coral" onClick={fillDates} className="!min-h-10 shrink-0 !py-2"><Icon name="clock" size={16} /> Estimate dates</Button></div>}

      {food.length === 0 ? <div className="mt-6"><Empty title="Your kitchen is empty" copy="Add what's in your fridge, freezer and cupboard. Recipes will show what you have and what you still need." /></div>
        : <div className="mt-6 grid gap-5 lg:grid-cols-3">{groups.map(({ s, items }) => <section key={s}>
          <div className="mb-2 flex items-center justify-between px-1"><h2 className="font-display text-xl">{STORAGE_LABEL[s]}</h2><span className="text-[.65rem] font-bold uppercase tracking-widest text-muted">{items.length} {items.length === 1 ? "item" : "items"}</span></div>
          <div className="card">{items.length ? items.map((item, i) => <div key={item.id} className={`flex items-center gap-2.5 px-3.5 py-3 sm:gap-3 sm:px-4 sm:py-3.5 ${i ? "border-t border-line" : ""}`}>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sage text-forest max-sm:hidden"><Icon name={STORAGE_ICON[s]} size={17} /></span>
            <QtyInput key={item.qty ?? ""} item={item} />
            <span className="min-w-0 flex-1 truncate font-semibold">{item.name}</span>
            <ExpiryChip item={item} />
            <button aria-label={`Remove ${item.name}`} onClick={() => removePantry([item.id])} className="text-muted hover:text-coral"><Icon name="close" size={17} /></button>
          </div>) : <p className="px-4 py-5 text-sm text-muted">Nothing here.</p>}</div>
        </section>)}</div>}

      <FlavorShelf />

      <section className="mt-8 rounded-3xl bg-sand p-5 lg:max-w-xl"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-coral"><Icon name="bag" /></span><div><h2 className="font-display text-xl">Needed for your recipes</h2><p className="mt-1 text-sm leading-5 text-muted">{toBuy ? `${toBuy} ingredient${toBuy === 1 ? " is" : "s are"} waiting in your shopping list.` : "Your shopping list is clear."}</p></div></div><a href="#/shopping" className="btn btn-secondary mt-5 w-full justify-center">View shopping list <Icon name="arrow" size={16} /></a></section>
    </Page>
  </main>;
}
