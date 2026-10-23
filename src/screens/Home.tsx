import { useState } from "react";
import { Button, Header, Icon, Page, RecipeImage } from "../components/ui";
import { daysUntil, isoDay, totalMinutes } from "../lib/food";
import { navigate } from "../lib/router";
import { useStore } from "../lib/store";

function greeting() {
  const d = new Date();
  const h = d.getHours();
  const part = h < 11 ? "morning" : h < 16 ? "afternoon" : "evening";
  return `${d.toLocaleDateString(undefined, { weekday: "long" })} ${part}`;
}

export function Home() {
  const { profile, pantry_items, recipes, plan_entries } = useStore();
  const [minutes, setMinutes] = useState(45);
  const initials = (profile.name || "Me").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const useSoon = pantry_items.map((p) => ({ ...p, d: daysUntil(p.expires_on) })).filter((p) => p.d !== null && p.d <= 3).sort((a, b) => a.d! - b.d!);
  const today = plan_entries.filter((p) => p.day === isoDay(new Date())).map((p) => recipes.find((r) => r.id === p.recipe_id)).filter(Boolean);
  const inspo = [...recipes].sort((a, b) => Number(b.favorite) - Number(a.favorite)).slice(0, 8);

  return <main>
    <Header right={<button onClick={() => navigate("/profile")} aria-label="Profile" className="grid size-9 place-items-center rounded-full bg-sage text-xs font-bold lg:hidden">{initials}</button>} />
    <Page>
      <div className="eyebrow">{greeting()}</div>
      <h1 className="mt-2 font-display text-[2.35rem] leading-[1.08] lg:text-[3rem]">What can we make{profile.name ? `, ${profile.name.split(" ")[0]}` : ""}?</h1>
      <p className="mt-3 leading-6 text-muted">{pantry_items.length ? `You have ${pantry_items.length} ingredient${pantry_items.length === 1 ? "" : "s"} ready to become dinner.` : "Add what's in your fridge and we'll find meals that use it."}</p>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <section className="relative overflow-hidden rounded-[1.75rem] bg-forest p-6 text-white lg:p-8">
          <span className="grid size-10 place-items-center rounded-full bg-white/10 text-mint"><Icon name="sparkle" /></span>
          <h2 className="mt-6 font-display text-[1.85rem] leading-tight">How much time do you have?</h2>
          <p className="mt-2 text-sm leading-5 text-white/60">We’ll include prep, cooking, eating, and cleanup.</p>
          <div className="mt-6 flex items-end gap-2"><span className="font-display text-5xl">{minutes}</span><span className="pb-1 text-sm text-white/60">minutes total</span></div>
          <input aria-label="Available time in minutes" type="range" min="20" max="120" step="5" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="time-range mt-5" />
          <div className="mt-2 flex justify-between text-[.65rem] font-semibold text-white/45"><span>20 min</span><span>2 hours</span></div>
          <Button variant="coral" onClick={() => navigate(`/options?m=${minutes}`)} className="mt-6 w-full justify-center">What can I make now? <Icon name="arrow" size={17} /></Button>
        </section>

        <div className="space-y-4">
          <a href="#/ingredients" className="flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-soft">
            <span className="grid size-12 place-items-center rounded-2xl bg-sage text-forest"><Icon name="ingredients" /></span>
            <span className="flex-1"><span className="block font-bold">Your kitchen</span><span className="mt-0.5 block text-sm text-muted">{pantry_items.length} ingredients available</span></span><Icon name="arrow" size={18} />
          </a>
          <a href="#/plan" className="flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-soft">
            <span className="grid size-12 place-items-center rounded-2xl bg-sand text-coral"><Icon name="calendar" /></span>
            <span className="min-w-0 flex-1"><span className="block font-bold">Today's plan</span><span className="mt-0.5 block truncate text-sm text-muted">{today.length ? today.map((r) => r!.title).join(", ") : "Nothing planned. Plan your week"}</span></span><Icon name="arrow" size={18} />
          </a>
          {useSoon.length > 0 && <section className="rounded-3xl bg-[#fff2ec] p-5">
            <div className="eyebrow">Use soon</div>
            <div className="mt-3 flex flex-wrap gap-2">{useSoon.slice(0, 8).map((p) => <span key={p.id} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#a53f28]">{p.name} · {p.d! < 0 ? "expired" : p.d === 0 ? "today" : `${p.d}d`}</span>)}</div>
            <p className="mt-3 text-xs leading-5 text-muted">Claude ideas on the next screen will try to use these first.</p>
          </section>}
        </div>
      </div>

      <div className="mt-10 flex items-end justify-between"><div><div className="eyebrow">Made for you</div><h2 className="mt-1 font-display text-2xl">Quick inspiration</h2></div><a href="#/recipes" className="text-sm font-bold text-coral">See all</a></div>
      {inspo.length ? <div className="no-scrollbar -mx-5 mt-4 flex gap-3 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:px-0">
        {inspo.map((r) => <a key={r.id} href={`#/recipe/${r.id}`} className="w-56 shrink-0 overflow-hidden rounded-3xl bg-white text-left shadow-soft lg:w-auto"><RecipeImage src={r.image} title={r.title} className="h-28" /><span className="block p-4"><span className="block font-display text-lg leading-tight">{r.title}</span><span className="mt-1 flex items-center gap-1 text-xs text-muted"><Icon name="clock" size={13} />{totalMinutes(r, profile.eat_minutes)} min total</span></span></a>)}
      </div> : <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <a href="#/new" className="rounded-3xl bg-white p-5 shadow-soft"><Icon name="edit" /><div className="mt-3 font-display text-lg">Add your own recipe</div><p className="mt-1 text-xs text-muted">Type in a favorite you already make.</p></a>
        <a href="#/browse" className="rounded-3xl bg-white p-5 shadow-soft"><Icon name="globe" /><div className="mt-3 font-display text-lg">Browse TheMealDB</div><p className="mt-1 text-xs text-muted">Free recipes with photos, search by ingredient.</p></a>
        <a href={`#/options?m=${minutes}`} className="rounded-3xl bg-white p-5 shadow-soft"><Icon name="sparkle" /><div className="mt-3 font-display text-lg">Ask Claude</div><p className="mt-1 text-xs text-muted">Ideas built around what's in your fridge.</p></a>
      </div>}
    </Page>
  </main>;
}
