import { useState } from "react";
import { Button, Icon, Logo } from "../components/ui";
import { QUESTIONS, type PrefKey } from "../lib/prefs";
import { useStore } from "../lib/store";

export function PrefPicker({ value, onChange, only }: { value: Record<PrefKey, string[]>; onChange: (key: PrefKey, next: string[]) => void; only?: PrefKey }) {
  return <div className="space-y-11">
    {QUESTIONS.filter((q) => !only || q.key === only).map((q, i) => {
      const selected = value[q.key];
      const toggle = (c: string) => onChange(q.key, selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c]);
      const custom = selected.filter((s) => !q.choices.includes(s));
      return <section key={q.key} className={i ? "border-t border-line pt-10" : ""}>
        {!only && <div className="flex items-start gap-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sage text-xs font-bold text-forest">{i + 1}</span>
          <div><h2 className="font-display text-[1.65rem] leading-tight">{q.title}</h2><p className="mt-2 text-sm leading-5 text-muted">{q.copy}</p></div>
        </div>}
        <div className={`mt-5 ${q.chips ? "flex flex-wrap gap-2" : "grid gap-2.5 sm:grid-cols-2"}`}>
          {[...q.choices, ...custom].map((c) => q.chips
            ? <button key={c} onClick={() => toggle(c)} className={`cuisine-chip ${selected.includes(c) ? "cuisine-chip-active" : ""}`}>{c}{selected.includes(c) && <Icon name="check" size={13} />}</button>
            : <button key={c} onClick={() => toggle(c)} className={`choice ${selected.includes(c) ? "choice-active" : ""}`}><span>{c}</span><span className={`choice-check ${selected.includes(c) ? "bg-coral text-white" : ""}`}>{selected.includes(c) && <Icon name="check" size={14} />}</span></button>)}
        </div>
        <OtherInput onAdd={(v) => !selected.includes(v) && onChange(q.key, [...selected, v])} />
      </section>;
    })}
  </div>;
}

function OtherInput({ onAdd }: { onAdd: (v: string) => void }) {
  const [v, setV] = useState("");
  const add = () => { if (v.trim()) { onAdd(v.trim()); setV(""); } };
  return <div className="mt-3 flex gap-2"><input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Other — type and press Enter" className="field !bg-white/70" /><Button variant="secondary" onClick={add} disabled={!v.trim()} className="!px-3.5"><Icon name="plus" size={18} /></Button></div>;
}

export function Onboarding() {
  const { profile, saveProfile } = useStore();
  const [name, setName] = useState(profile.name);
  const [prefs, setPrefs] = useState<Record<PrefKey, string[]>>({ diets: profile.diets, avoid: profile.avoid, cuisines: profile.cuisines, kitchen: profile.kitchen, inspiration: profile.inspiration, skill: profile.skill });

  return <main className="min-h-dvh bg-cream">
    <header className="sticky top-0 z-20 border-b border-line bg-cream/95 px-5 pb-4 pt-6 backdrop-blur-xl"><div className="mx-auto flex max-w-2xl items-center justify-between"><Logo /><span className="text-xs font-bold text-muted">Your preferences</span></div></header>
    <section className="mx-auto max-w-2xl px-5 pb-32 pt-7">
      <div className="eyebrow">Make it yours</div>
      <h1 className="mt-2 font-display text-[2.35rem] leading-tight">Tell us what feels like home.</h1>
      <p className="mt-3 leading-6 text-muted">Choose everything that fits. You can update these anytime in Profile.</p>
      <label className="mt-8 block"><span className="label">What should we call you?</span><input value={name} onChange={(e) => setName(e.target.value)} className="field mt-2" placeholder="Your name" /></label>
      <div className="mt-10"><PrefPicker value={prefs} onChange={(k, v) => setPrefs({ ...prefs, [k]: v })} /></div>
    </section>
    <footer className="fixed inset-x-0 bottom-0 border-t border-line bg-cream/95 p-5 backdrop-blur-xl"><div className="mx-auto max-w-2xl"><Button onClick={() => saveProfile({ ...prefs, name: name.trim() || profile.name, onboarded: true })} className="w-full justify-center">Build my kitchen <Icon name="arrow" size={17} /></Button></div></footer>
  </main>;
}
