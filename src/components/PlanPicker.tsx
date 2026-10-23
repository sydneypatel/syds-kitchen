import { useState } from "react";
import { addDays, isoDay } from "../lib/food";
import { useStore } from "../lib/store";
import { Button, Icon, Sheet, toast } from "./ui";

/** Sheet for putting a recipe on one or more days in the next two weeks. */
export function PlanPicker({ open, onClose, recipeId, title }: { open: boolean; onClose: () => void; recipeId: string; title: string }) {
  const { addPlan, plan_entries } = useStore();
  const [days, setDays] = useState<string[]>([]);
  const [servings, setServings] = useState(1);
  const start = new Date();
  const options = Array.from({ length: 14 }, (_, i) => addDays(start, i));

  const save = () => {
    days.forEach((d) => addPlan(d, recipeId, servings));
    toast(`Planned for ${days.length} day${days.length === 1 ? "" : "s"}`);
    setDays([]);
    onClose();
  };

  return <Sheet open={open} onClose={onClose} title="Add to plan" subtitle={title}>
    <div className="mt-5 label">Pick days</div>
    <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">{options.map((d) => {
      const iso = isoDay(d);
      const on = days.includes(iso);
      const count = plan_entries.filter((p) => p.day === iso).length;
      return <button key={iso} onClick={() => setDays(on ? days.filter((x) => x !== iso) : [...days, iso])} className={`rounded-xl border px-1 py-2.5 text-center ${on ? "border-forest bg-forest text-white" : "border-line bg-white"}`}>
        <span className="block text-[.62rem] font-bold uppercase tracking-wider opacity-70">{d.toLocaleDateString(undefined, { weekday: "short" })}</span>
        <span className="block font-display text-lg">{d.getDate()}</span>
        <span className={`mx-auto mt-0.5 block size-1.5 rounded-full ${count ? (on ? "bg-mint" : "bg-coral") : "bg-transparent"}`} />
      </button>;
    })}</div>
    <div className="mt-5 flex items-center justify-between rounded-2xl bg-white p-3"><span className="text-sm font-semibold">Portions to prep</span><div className="flex items-center gap-3"><button aria-label="Fewer" onClick={() => setServings(Math.max(1, servings - 1))} className="icon-btn !bg-cream"><Icon name="minus" size={16} /></button><b className="w-5 text-center">{servings}</b><button aria-label="More" onClick={() => setServings(servings + 1)} className="icon-btn !bg-cream"><Icon name="plus" size={16} /></button></div></div>
    <Button onClick={save} disabled={!days.length} className="mt-6 w-full justify-center"><Icon name="calendar" size={17} /> Add to {days.length || ""} day{days.length === 1 ? "" : "s"}</Button>
  </Sheet>;
}
