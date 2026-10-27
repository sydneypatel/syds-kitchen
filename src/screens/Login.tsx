import { useState } from "react";
import { supabase } from "../lib/backend";
import { Button, Icon, Logo } from "../components/ui";

const HERO = "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1600&q=80";

/** True when opened from the iPhone home screen (separate from Safari, so email links can't sign it in). */
const isHomeScreenApp = () => window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function Login() {
  const [mode, setMode] = useState<"password" | "link">(() => (localStorage.getItem("my-kitchen:login-mode") === "link" && !isHomeScreenApp() ? "link" : "password"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = (m: "password" | "link") => {
    setMode(m);
    setError(null);
    try {
      localStorage.setItem("my-kitchen:login-mode", m);
    } catch {
      /* ignore */
    }
  };

  const submit = async () => {
    if (!supabase || !email.trim()) return;
    setBusy(true);
    setError(null);
    if (mode === "password") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setBusy(false);
      if (error) setError(/invalid login/i.test(error.message) ? "Email or password didn't match. No password yet? Sign in with an email link once, then set one in Profile." : error.message);
    } else {
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } });
      setBusy(false);
      if (error) setError(/rate limit/i.test(error.message) ? "Too many sign-in emails for now. Use your password instead, or try again in an hour." : error.message);
      else setSent(true);
    }
  };

  return <main className="relative flex min-h-dvh flex-col overflow-hidden bg-forest lg:grid lg:grid-cols-[1.1fr_1fr]">
    <img src={HERO} alt="Colorful bowls of homemade food" className="absolute inset-0 size-full object-cover lg:relative lg:h-dvh" />
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,44,37,.2),rgba(24,44,37,.95))] lg:hidden" />
    <div className="relative flex min-h-dvh flex-col px-6 pb-8 pt-7 text-white lg:justify-center lg:px-16">
      <Logo light />
      <div className="mt-auto max-w-md lg:mt-16">
        <div className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-mint">Cook with what you have</div>
        <h1 className="font-display text-[2.7rem] leading-[1.02] lg:text-[3.4rem]">Good food starts right where you are.</h1>
        <p className="mt-4 leading-6 text-white/75">Your recipes, your kitchen, a smarter grocery list, and less food left behind.</p>

        {sent ? <div className="mt-7 rounded-3xl bg-white/10 p-5">
          <div className="flex items-center gap-2 font-bold"><Icon name="check" /> Check your email</div>
          <p className="mt-2 text-sm leading-5 text-white/75">We sent a sign-in link to <b>{email}</b>. Open it on this device, in this browser.</p>
          <button onClick={() => setSent(false)} className="mt-3 text-sm font-semibold text-mint">Use a different email</button>
        </div> : <form className="mt-7" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <div className="mb-4 flex rounded-full bg-white/10 p-1">{(["password", "link"] as const).map((m) => <button type="button" key={m} onClick={() => switchMode(m)} className={`flex-1 rounded-full py-2 text-xs font-bold ${mode === m ? "bg-white text-forest" : "text-white/70"}`}>{m === "password" ? "Password" : "Email me a link"}</button>)}</div>
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-white/60">Email</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field mt-2 !border-white/20" />
          {mode === "password" && <><label htmlFor="password" className="mt-4 block text-xs font-bold uppercase tracking-widest text-white/60">Password</label>
            <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="field mt-2 !border-white/20" /></>}
          <Button type="submit" disabled={busy || !email.trim() || (mode === "password" && !password)} className="mt-4 w-full justify-center !border-white !bg-white !text-forest">{busy ? (mode === "password" ? "Signing in…" : "Sending…") : mode === "password" ? "Sign in" : "Email me a sign-in link"} <Icon name="arrow" size={17} /></Button>
          {error && <p className="mt-3 text-sm leading-5 text-[#ffb4a2]">{error}</p>}
        </form>}
        <p className="mt-7 text-center text-[.7rem] leading-4 text-white/45 lg:text-left">{mode === "password" ? "Set or change your password anytime in Profile." : "No password needed. You'll stay signed in on this device."}</p>
      </div>
    </div>
  </main>;
}
