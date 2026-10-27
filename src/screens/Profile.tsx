import { useState } from "react";
import { Button, Header, Icon, Page, Sheet, toast } from "../components/ui";
import { isLocalMode, supabase } from "../lib/backend";
import { QUESTIONS, summary, type PrefKey } from "../lib/prefs";
import { useStore } from "../lib/store";
import { PrefPicker } from "./Onboarding";

export function Profile({ email }: { email: string | null }) {
  const { profile, saveProfile } = useStore();
  const [editing, setEditing] = useState<PrefKey | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [name, setName] = useState(profile.name);
  const [store, setStore] = useState(profile.store);
  const [notes, setNotes] = useState(profile.notes);
  const initials = (profile.name || "Me").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const q = QUESTIONS.find((x) => x.key === editing);

  return <main>
    <Header title="Profile" />
    <Page className="max-w-3xl">
      <div className="flex items-center gap-4"><span className="grid size-16 place-items-center rounded-full bg-forest font-display text-xl text-white">{initials}</span><div><div className="font-display text-2xl">{profile.name || "Me"}</div><div className="mt-1 text-sm text-muted">{email ?? "Local mode · saved in this browser"}</div></div></div>

      <div className="mt-8 space-y-5">
        {QUESTIONS.map((x) => <section key={x.key}><div className="mb-2 label">{x.label}</div><button onClick={() => { setDraft(profile[x.key]); setEditing(x.key); }} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white p-4 text-left shadow-soft"><span className={`text-sm font-semibold ${profile[x.key].length ? "" : "text-muted"}`}>{summary(profile, x.key)}</span><Icon name="arrow" size={16} /></button></section>)}
      </div>

      <section className="mt-8 space-y-5 rounded-3xl bg-white p-5 shadow-soft">
        <label className="block"><span className="label">Name</span><input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name !== profile.name && saveProfile({ name })} className="field mt-2" /></label>
        <label className="block"><span className="label">Usual grocery store</span><input value={store} onChange={(e) => setStore(e.target.value)} onBlur={() => store !== profile.store && saveProfile({ store })} placeholder="Gristedes · Roosevelt Island" className="field mt-2" /></label>
        <div><span className="label">Time to eat (counted in “How much time do you have?”)</span><div className="mt-2 flex items-center gap-3"><input type="range" min="0" max="45" step="5" value={profile.eat_minutes} onChange={(e) => saveProfile({ eat_minutes: Number(e.target.value) })} className="rating-range" aria-label="Minutes to eat" /><span className="w-14 text-right text-sm font-bold">{profile.eat_minutes} min</span></div></div>
        <label className="block"><span className="label">Anything else Claude should know</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== profile.notes && (saveProfile({ notes }), toast("Saved"))} placeholder="e.g. one pot only, I like spicy food, cooking for 1 but want leftovers for lunch" className="note-field mt-2 !bg-cream" /><span className="mt-2 block text-xs text-muted">Keep your spices, sauces &amp; oils on the <a href="#/ingredients" className="font-bold text-coral">Ingredients</a> page. Claude reads them from there.</span></label>
      </section>

      <section className="mt-7 rounded-3xl bg-sage p-5"><span className="grid size-10 place-items-center rounded-full bg-white text-forest"><Icon name="sparkle" /></span><div className="mt-4 font-display text-xl">Your recipes, personalized</div><p className="mt-2 text-sm leading-5 text-forest/70">Changes here shape Claude's meal ideas and what counts as a good fit.</p></section>

      {!isLocalMode && <button onClick={() => supabase?.auth.signOut()} className="mt-8 w-full text-center text-sm font-bold text-coral">Sign out</button>}
    </Page>

    <Sheet open={!!editing} onClose={() => setEditing(null)} title={q?.title ?? ""} subtitle={q?.copy} wide>
      {editing && <div><PrefPicker value={{ [editing]: draft } as Record<PrefKey, string[]>} onChange={(_, v) => setDraft(v)} only={editing} /></div>}
      <Button onClick={() => { if (editing) saveProfile({ [editing]: draft }); setEditing(null); }} className="mt-6 w-full justify-center">Save</Button>
    </Sheet>
  </main>;
}
