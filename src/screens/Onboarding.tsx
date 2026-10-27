import { useState } from "react";
import { Button, Icon, Logo } from "../components/ui";
import { QUESTIONS, type PrefKey } from "../lib/prefs";
import { useStore } from "../lib/store";

function StepHeading({ n, title, copy }: { n: number; title: string; copy: string }) {
  return <div className="flex items-start gap-3">
    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sage text-xs font-bold text-forest">{n}</span>
    <div><h2 className="font-display text-[1.65rem] leading-tight">{title}</h2><p className="mt-2 text-sm leading-5 text-muted">{copy}</p></div>
  </div>;
}

/** Multi-select questions. `only` shows a single question without its heading (used by Profile's edit sheet). */
export function PrefPicker({ value, onChange, only, startAt = 1 }: { value: Record<PrefKey, string[]>; onChange: (key: PrefKey, next: string[]) => void; only?: PrefKey; startAt?: number }) {
  return <div className="space-y-11">
    {QUESTIONS.filter((q) => !only || q.key === only).map((q, i) => {
      const selected = value[q.key] ?? [];
      const toggle = (c: string) => onChange(q.key, selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c]);
      const custom = selected.filter((s) => !q.choices.includes(s));
      return <section key={q.key} className={!only ? "border-t border-line pt-10" : ""}>
        {!only && <StepHeading n={startAt + i} title={q.title} copy={q.copy} />}
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
  const [prefs, setPrefs] = useState<Record<PrefKey, string[]>>(() => Object.fromEntries(QUESTIONS.map((q) => [q.key, profile[q.key] ?? []])) as Record<PrefKey, string[]>);
  const ready = name.trim().length > 0;

  return <main className="min-h-dvh bg-cream">
    <header className="sticky top-0 z-20 border-b border-line bg-cream/95 px-5 pb-4 pt-6 backdrop-blur-xl"><div className="mx-auto flex max-w-2xl items-center justify-between"><Logo /><span className="text-xs font-bold text-muted">Your preferences</span></div></header>
    <section className="mx-auto max-w-2xl px-5 pb-32 pt-7">
      <div className="eyebrow">Make it yours</div>
      <h1 className="mt-2 font-display text-[2.35rem] leading-tight">Tell us what feels like home.</h1>
      <p className="mt-3 leading-6 text-muted">Choose everything that fits. You can update these anytime in Profile.</p>

      <section className="mt-9">
        <StepHeading n={1} title="What’s your name?" copy="So we know what to call you." />
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" className="field mt-5" placeholder="Your first name" aria-label="Your name" />
      </section>

      <div className="mt-11"><PrefPicker value={prefs} onChange={(k, v) => setPrefs({ ...prefs, [k]: v })} startAt={2} /></div>
    </section>
    <footer className="fixed inset-x-0 bottom-0 border-t border-line bg-cream/95 p-5 backdrop-blur-xl"><div className="mx-auto max-w-2xl">
      {!ready && <p className="mb-2 text-center text-xs font-semibold text-muted">Add your name to continue</p>}
      <Button disabled={!ready} onClick={() => saveProfile({ ...prefs, name: name.trim(), onboarded: true })} className="w-full justify-center">Build my kitchen <Icon name="arrow" size={17} /></Button>
    </div></footer>
  </main>;
}
