import { useEffect, useState } from "react";
import { Button, Empty, Header, Icon, Page, Title } from "../components/ui";
import { navigate, putDraft } from "../lib/router";
import { getMeal, randomMeals, searchMeals, type MealSummary } from "../lib/sources";
import { useStore } from "../lib/store";

let cache: { q: string; by: "name" | "ingredient"; results: MealSummary[] } | null = null;

export function Browse() {
  const { pantry_items } = useStore();
  const [q, setQ] = useState(cache?.q ?? "");
  const [by, setBy] = useState<"name" | "ingredient">(cache?.by ?? "ingredient");
  const [results, setResults] = useState<MealSummary[]>(cache?.results ?? []);
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (query: string, mode: "name" | "ingredient") => {
    setBusy(true);
    setError(null);
    try {
      const r = query.trim() ? await searchMeals(query, mode) : await randomMeals(8);
      setResults(r);
      cache = { q: query, by: mode, results: r };
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!cache) run("", by);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = async (m: MealSummary) => {
    setOpening(m.id);
    try {
      const draft = await getMeal(m.id);
      navigate(`/draft/${putDraft(draft)}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOpening(null);
    }
  };

  const pantryChips = [...new Set(pantry_items.map((p) => p.name))].slice(0, 12);

  return <main>
    <Header title="Browse" back="/recipes" />
    <Page>
      <Title eyebrow="TheMealDB" title="Find something new" copy="Free recipes with photos. Search by ingredient to use what you have, then save the ones you like." />
      <form className="mt-6 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); run(q, by); }}>
        <div className="flex shrink-0 rounded-full border border-line bg-white p-1">{(["ingredient", "name"] as const).map((m) => <button type="button" key={m} onClick={() => setBy(m)} className={`rounded-full px-4 py-2 text-xs font-bold ${by === m ? "bg-forest text-white" : "text-muted"}`}>By {m}</button>)}</div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={by === "ingredient" ? "e.g. chicken, chickpeas, salmon" : "e.g. curry, pasta, tacos"} className="field" />
        <Button type="submit" disabled={busy} className="shrink-0 justify-center"><Icon name="search" size={16} /> Search</Button>
      </form>
      {pantryChips.length > 0 && <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0"><span className="shrink-0 self-center text-xs font-bold text-muted">From your kitchen:</span>{pantryChips.map((n) => <button key={n} onClick={() => { setQ(n); setBy("ingredient"); run(n, "ingredient"); }} className="chip">{n}</button>)}<button onClick={() => { setQ(""); run("", by); }} className="chip"><span className="flex items-center gap-1"><Icon name="refresh" size={13} /> Surprise me</span></button></div>}
      {error && <p className="mt-4 text-sm font-semibold text-[#a53f28]">{error}</p>}
      {busy ? <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-white/70" />)}</div>
        : results.length ? <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{results.map((m) => <button key={m.id} onClick={() => open(m)} disabled={!!opening} className="card text-left transition-transform hover:-translate-y-0.5 disabled:opacity-100"><img src={m.image} alt={m.title} loading="lazy" className="aspect-square w-full object-cover" /><span className="flex items-center justify-between gap-2 p-3.5"><span className="font-display text-base leading-tight">{m.title}</span>{opening === m.id ? <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-coral border-t-transparent" /> : <Icon name="arrow" size={15} />}</span></button>)}</div>
        : <div className="mt-6"><Empty title="No recipes found" copy={by === "ingredient" ? "TheMealDB matches one main ingredient at a time. Try a simpler word, like 'chicken' instead of 'chicken thighs'." : "Try a different name."} /></div>}
      <p className="mt-8 text-center text-xs text-muted">Recipes from <a href="https://www.themealdb.com" target="_blank" rel="noreferrer" className="underline">TheMealDB</a>. Their times aren't listed, so My Kitchen estimates them; edit after saving.</p>
    </Page>
  </main>;
}
