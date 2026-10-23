import { useState } from "react";
import { Button, Header, Icon, Page, Sheet, Title, toast } from "../components/ui";
import { guessAisle, sameFood } from "../lib/food";
import { useStore } from "../lib/store";
import { AISLES, type Aisle } from "../lib/types";

export function Shopping() {
  const { shopping_items, recipes, profile, addShopping, updateShopping, removeShopping, moveCheckedToPantry } = useStore();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [aisle, setAisle] = useState<Aisle | null>(null);

  const total = shopping_items.length;
  const checked = shopping_items.filter((s) => s.checked).length;
  const name = draft.trim();
  const duplicate = !!name && shopping_items.some((s) => !s.checked && sameFood(s.name, name));
  const chosenAisle = aisle ?? (name ? guessAisle(name) : "Produce");

  const add = () => {
    if (!name || duplicate) return;
    addShopping([name], chosenAisle);
    setDraft("");
    setAisle(null);
    setAdding(false);
  };
  const close = () => { setDraft(""); setAisle(null); setAdding(false); };

  return <main>
    <Header title="Shopping list" back="/ingredients" right={<button onClick={() => setAdding(true)} aria-label="Add shopping list item" className="icon-btn"><Icon name="plus" /></button>} />
    <Page className="max-w-4xl">
      <div className="hidden lg:block"><Title title="Shopping list" copy="Items from your recipes and weekly plan, combined and organized by aisle." right={<Button onClick={() => setAdding(true)}><Icon name="plus" size={16} /> Add item</Button>} /></div>
      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.store || "grocery store")}`} target="_blank" rel="noreferrer" className="block rounded-3xl bg-forest p-5 text-white lg:mt-6">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-white/10 text-mint"><Icon name="pin" /></span><div className="flex-1"><span className="block text-xs text-white/55">Shopping near</span><b className="block text-sm">{profile.store || "Set your usual store in Profile"}</b></div><Icon name="external" size={16} /></div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-coral transition-[width]" style={{ width: `${total ? (checked / total) * 100 : 0}%` }} /></div>
        <div className="mt-2 text-right text-[.65rem] text-white/50">{checked} of {total} collected</div>
      </a>

      {checked > 0 && <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-sage p-4 sm:flex-row sm:items-center"><p className="flex-1 text-sm text-forest"><b>{checked} collected.</b> Put them in your kitchen so recipes know you have them.</p><div className="flex gap-2"><Button onClick={() => { const n = moveCheckedToPantry(); toast(`Moved ${n} to your kitchen`); }} className="!min-h-10 !py-2"><Icon name="ingredients" size={16} /> Move to kitchen</Button><Button variant="ghost" onClick={() => removeShopping(shopping_items.filter((s) => s.checked).map((s) => s.id))} className="!min-h-10 !py-2">Clear</Button></div></div>}

      <div className="mt-6 grid gap-5 md:grid-cols-2">{AISLES.map((group) => {
        const items = shopping_items.filter((s) => s.aisle === group);
        if (!items.length) return null;
        return <section key={group}><div className="mb-2 flex items-center justify-between px-1"><h2 className="font-display text-xl">{group}</h2><span className="text-[.65rem] font-bold uppercase tracking-widest text-muted">{items.length} {items.length === 1 ? "item" : "items"}</span></div>
          <div className="card">{items.map((item, i) => { const from = item.recipe_id ? recipes.find((r) => r.id === item.recipe_id)?.title : null; return <div key={item.id} className={`flex items-center ${i ? "border-t border-line" : ""}`}>
            <button onClick={() => updateShopping(item.id, { checked: !item.checked })} aria-label={`Mark ${item.name} ${item.checked ? "not collected" : "collected"}`} className="flex min-w-0 flex-1 items-center gap-3 p-4 text-left">
              <span className={`grid size-6 shrink-0 place-items-center rounded-full border ${item.checked ? "border-coral bg-coral text-white" : "border-line"}`}>{item.checked && <Icon name="check" size={14} />}</span>
              <span className="min-w-0 flex-1"><span className={`block truncate text-sm font-semibold ${item.checked ? "text-muted line-through" : ""}`}>{item.name}</span>{from && <span className="block truncate text-[.65rem] text-muted">for {from}</span>}</span>
            </button>
            <button onClick={() => removeShopping([item.id])} aria-label={`Delete ${item.name} from shopping list`} className="mr-2 grid size-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-sand hover:text-coral"><Icon name="trash" size={17} /></button>
          </div>; })}</div>
        </section>;
      })}</div>
      {total === 0 && <div className="mt-6 rounded-2xl border border-line bg-white p-6 text-center"><div className="font-display text-xl">Your list is clear</div><p className="mt-2 text-sm text-muted">Add ingredients when you’re ready for your next shop, or build one from your weekly plan.</p></div>}
      <div className="mt-6 rounded-2xl bg-sand p-4 text-sm leading-5 text-muted"><b className="text-ink">Smart shopping</b><br />Items from your chosen and planned recipes are combined, de-duplicated, and organized by aisle.</div>
    </Page>

    <Sheet open={adding} onClose={close} title="Add an item" subtitle="What do you need for your next meal?">
      <label className="mt-6 block label" htmlFor="shopping-item">Item name</label>
      <input id="shopping-item" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="e.g. Avocados" className="field mt-2" />
      {duplicate && <p className="mt-2 text-xs font-semibold text-coral">That item is already on your list.</p>}
      <div className="mt-5 label">Choose an aisle</div>
      <div className="mt-3 grid grid-cols-3 gap-2">{AISLES.map((g) => <button key={g} onClick={() => setAisle(g)} className={`rounded-xl border px-2 py-3 text-xs font-bold transition-colors ${chosenAisle === g ? "border-forest bg-forest text-white" : "border-line bg-white text-ink"}`}>{g}</button>)}</div>
      <Button onClick={add} disabled={!name || duplicate} className="mt-6 w-full justify-center"><Icon name="plus" size={17} /> Add to shopping list</Button>
    </Sheet>
  </main>;
}
