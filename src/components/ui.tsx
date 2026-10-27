import { useEffect, useState, type ReactNode } from "react";
import { back as goBack } from "../lib/router";

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-7h6v7" /></>,
    ingredients: <><path d="M20 4C12 4 5 7 5 14c0 3 2 5 5 5 7 0 10-7 10-15Z" /><path d="M4 21c3-6 7-9 13-13" /></>,
    recipes: <><path d="M4 3h13a3 3 0 0 1 3 3v15H7a3 3 0 0 1-3-3Z" /><path d="M7 3v18M10 8h6M10 12h6" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    sparkle: <><path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7Z" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <path d="m9 18 6-6-6-6" />,
    back: <path d="m15 18-6-6 6-6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    bag: <><path d="M4 7h16l-1.5 13h-13Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v7H4V6h7" /></>,
    edit: <><path d="m4 20 4.5-1 10-10-3.5-3.5-10 10Z" /><path d="m13.5 6.5 3.5 3.5" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" /><path d="M10 11v5M14 11v5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
    refresh: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></>,
    pot: <><path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" /><path d="M2 10h20M9 6c0-1 1-2 1-3M14 6c0-1 1-2 1-3" /></>,
    snow: <path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11" />,
    camera: <><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13.5" r="3.5" /></>,
    jar: <><path d="M8 3h8v3H8z" /><path d="M7 6h10a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" /><path d="M5 12h14" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function Button({ children, onClick, variant = "primary", disabled = false, className = "", type = "button" }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "coral"; disabled?: boolean; className?: string; type?: "button" | "submit" }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`btn btn-${variant} ${className}`}>{children}</button>;
}

export function Logo({ light = false, iconOnly = false }: { light?: boolean; iconOnly?: boolean }) {
  return <div className={`flex items-center gap-2 font-bold tracking-[-0.04em] ${light ? "text-white" : "text-ink"}`} aria-label={iconOnly ? "My Kitchen" : undefined}><span className="grid size-8 place-items-center rounded-full bg-coral text-white"><Icon name="ingredients" size={17} /></span>{!iconOnly && "My Kitchen"}</div>;
}

/** Top bar. On phones it shows the logo or a back button; on laptops the sidebar has the logo. */
export function Header({ title = "", back, right }: { title?: string; back?: string | boolean; right?: ReactNode }) {
  const onBack = () => (typeof back === "string" ? goBack(back) : goBack());
  return <header className={`sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-cream/92 px-5 backdrop-blur-xl lg:px-10 ${back ? "" : "lg:hidden"}`}>
    {back ? <button aria-label="Go back" onClick={onBack} className="icon-btn"><Icon name="back" /></button> : <a href="#/" className="lg:invisible"><Logo iconOnly /></a>}
    <div className="absolute left-1/2 -translate-x-1/2 text-sm font-bold">{title}</div>
    <div className="flex min-w-9 items-center justify-end gap-1">{right}</div>
  </header>;
}

export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 pb-10 pt-7 lg:px-10 lg:pt-10 ${className}`}>{children}</div>;
}

export function Title({ eyebrow, title, copy, right }: { eyebrow?: string; title: string; copy?: ReactNode; right?: ReactNode }) {
  return <div className="flex flex-wrap items-end justify-between gap-4">
    <div className="max-w-2xl">{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1 className="mt-2 font-display text-[2.15rem] leading-[1.08] lg:text-[2.75rem]">{title}</h1>{copy && <p className="mt-3 text-sm leading-6 text-muted lg:text-base">{copy}</p>}</div>
    {right}
  </div>;
}

export function Sheet({ open, onClose, title, subtitle, children, wide = false }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
    <button onClick={onClose} aria-label="Close dialog" className="absolute inset-0 size-full bg-ink/45 backdrop-blur-[2px]" />
    <section role="dialog" aria-modal="true" aria-label={title} className={`relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] bg-cream px-5 pb-7 pt-4 shadow-2xl lg:rounded-[2rem] lg:px-7 ${wide ? "lg:max-w-2xl" : "lg:max-w-md"}`}>
      <div className="mx-auto h-1 w-10 rounded-full bg-line lg:hidden" />
      <div className="mt-4 flex items-start justify-between gap-4">
        <div><div className="font-display text-2xl">{title}</div>{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}</div>
        <button onClick={onClose} aria-label="Close" className="icon-btn shrink-0"><Icon name="close" size={18} /></button>
      </div>
      {children}
    </section>
  </div>;
}

/**
 * A recipe's photo. Recipes without one show nothing (no fake image), except small
 * thumbnails (size-/w- classes, e.g. in the planner), which get a tiny icon tile.
 */
export function RecipeImage({ src, title, className = "" }: { src: string | null; title: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const thumb = /(^|\s)(size-|w-)/.test(className);
  if (src && !failed) return <img src={src} alt={title} loading="lazy" onError={() => setFailed(true)} className={`${thumb ? "" : "w-full"} object-cover ${className}`} />;
  if (!thumb) return null;
  return <div className={`grid place-items-center bg-sage text-forest/70 ${className}`}><Icon name="pot" size={20} /></div>;
}

export function Empty({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) {
  return <div className="rounded-3xl border border-dashed border-line bg-white/60 p-8 text-center"><div className="font-display text-xl">{title}</div><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{copy}</p>{action && <div className="mt-5 flex justify-center">{action}</div>}</div>;
}

export function SourceBadge({ source }: { source: "manual" | "mealdb" | "ai" }) {
  const label = source === "ai" ? "Claude idea" : source === "mealdb" ? "TheMealDB" : "My recipe";
  return <span className="rounded-full bg-white/90 px-2.5 py-1 text-[.62rem] font-bold uppercase tracking-wider text-forest">{label}</span>;
}

/** Small toast for confirmations ("Added 3 items"). */
let pushToast: ((msg: string) => void) | null = null;
export function toast(msg: string) {
  pushToast?.(msg);
}
export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let t: number | undefined;
    pushToast = (m) => {
      setMsg(m);
      window.clearTimeout(t);
      t = window.setTimeout(() => setMsg(null), 2600);
    };
    return () => {
      pushToast = null;
      window.clearTimeout(t);
    };
  }, []);
  if (!msg) return null;
  return <div role="status" className="fixed inset-x-0 bottom-24 z-[60] flex justify-center px-5 lg:bottom-8"><div className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-2xl">{msg}</div></div>;
}

/** "Add photo" button: opens the camera or photo library, uploads, and hands back the URL. */
export function PhotoButton({ onUpload, label = "Add photo", className = "", variant = "secondary" }: { onUpload: (file: File) => Promise<void>; label?: string; className?: string; variant?: "primary" | "secondary" | "ghost" | "coral" }) {
  const [busy, setBusy] = useState(false);
  return <label className={`btn btn-${variant} cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""} ${className}`}>
    <Icon name="camera" size={16} /> {busy ? "Uploading…" : label}
    <input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setBusy(true);
      try {
        await onUpload(file);
      } catch (err) {
        toast((err as Error).message || "Upload failed. Try again.");
      } finally {
        setBusy(false);
      }
    }} />
  </label>;
}
