import { useState } from "react";
import { TimingCard } from "../components/RecipeCard";
import { Button, Empty, Header, Icon, Page, Title } from "../components/ui";
import { daysUntil, missingFor, totalMinutes } from "../lib/food";
import { putDraft } from "../lib/router";
import { suggestRecipes } from "../lib/sources";
import { useStore } from "../lib/store";
import type { RecipeDraft } from "../lib/types";

// Keep AI ideas around while you click into one and come back.
const ideaCache = new Map<number, { draftId: string; draft: RecipeDraft }[]>();

export function MealOptions({ minutes }: { minutes: number }) {
  const { recipes, pantry_items, profile } = useStore();
  const [ideas, setIdeas] = useState(ideaCache.get(minutes) ?? []);
  const [ask, setAsk] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fits = recipes
    .filter((r) => totalMinutes(r, profile.eat_minutes) <= minutes)
    .map((r) => ({ r, missing: missingFor(r, pantry_items).length }))
    .sort((a, b) => a.missing - b.missing || totalMinutes(a.r) - totalMinutes(b.r));

  const getIdeas = async () => {
    setBusy(true);
    setError(null);
    try {
      const useSoon = pantry_items.filter((p) => { const d = daysUntil(p.expires_on); return d !== null && d <= 3; }).map((p) => p.name);
      const drafts = await suggestRecipes({ minutes, pantry: pantry_items.map((p) => p.name), useSoon, profile, request: ask.trim() || undefined });
      const next = [...drafts.map((draft) => ({ draftId: putDraft(draft), draft })), ...ideas];
      ideaCache.set(minutes, next);
      setIdeas(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return <main>
    <Header title="Meal options" back="/" />
    <Page>
      <Title eyebrow={`Ready in ${minutes} minutes`} title="Here’s what fits your evening." copy={`Times include prep, cooking, ${profile.eat_minutes} minutes to eat, and a quick cleanup.`} />

      <section className="mt-8">
        <h2 className="font-display text-2xl">From your recipes</h2>
        {fits.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{fits.map(({ r }) => <TimingCard key={r.id} recipe={r} href={`#/recipe/${r.id}`} />)}</div>
          : <div className="mt-4"><Empty title={recipes.length ? "Nothing saved fits this window" : "No saved recipes yet"} copy={recipes.length ? "Try more time, or ask Claude for something quicker below." : "Ask Claude below, browse TheMealDB, or add a recipe you already make."} action={<div className="flex flex-wrap justify-center gap-2"><Button variant="secondary" onClick={() => (location.hash = "/browse")}><Icon name="globe" size={16} /> Browse TheMealDB</Button><Button variant="secondary" onClick={() => (location.hash = "/new")}><Icon name="plus" size={16} /> Add a recipe</Button></div>} /></div>}
      </section>

      <section className="mt-10 rounded-[1.75rem] bg-sage p-5 lg:p-7">
        <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-forest"><Icon name="sparkle" /></span><div><h2 className="font-display text-2xl">Fresh ideas from Claude</h2><p className="mt-1 text-sm leading-5 text-forest/75">Built around your {pantry_items.length} ingredients and your preferences. Save the ones you like.</p></div></div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row"><input value={ask} onChange={(e) => setAsk(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !busy && getIdeas()} placeholder="Anything specific? e.g. high protein, use up the spinach, lunch I can pack" className="field" /><Button onClick={getIdeas} disabled={busy} className="shrink-0 justify-center">{busy ? "Thinking…" : ideas.length ? "More ideas" : "Get 3 ideas"} <Icon name="sparkle" size={16} /></Button></div>
        {error && <p className="mt-3 text-sm font-semibold text-[#a53f28]">{error}</p>}
        {busy && <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-72 animate-pulse rounded-3xl bg-white/60" />)}</div>}
        {ideas.length > 0 && <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{ideas.map(({ draftId, draft }) => <TimingCard key={draftId} recipe={draft} href={`#/draft/${draftId}`} cta="Preview" />)}</div>}
      </section>
    </Page>
  </main>;
}
