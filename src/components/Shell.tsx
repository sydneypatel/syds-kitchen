import type { ReactNode } from "react";
import { isLocalMode } from "../lib/backend";
import { navigate } from "../lib/router";
import { useStore } from "../lib/store";
import { Icon, Logo } from "./ui";

export type Tab = "home" | "ingredients" | "recipes" | "plan" | "favorites" | "profile" | "shopping";

const TABS: [Tab, string, string][] = [
  ["home", "home", "Home"],
  ["ingredients", "ingredients", "Ingredients"],
  ["recipes", "recipes", "Recipes"],
  ["plan", "calendar", "Plan"],
  ["favorites", "heart", "Favorites"],
  ["profile", "user", "Profile"],
];

export function Shell({ tab, children }: { tab: Tab | null; children: ReactNode }) {
  const { shopping_items, profile } = useStore();
  const toBuy = shopping_items.filter((s) => !s.checked).length;
  const initials = (profile.name || "Me").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return <div className="min-h-dvh bg-cream lg:grid lg:grid-cols-[248px_1fr]">
    {/* Laptop sidebar */}
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-cream px-4 py-6 lg:flex">
      <div className="px-2"><Logo /></div>
      <nav className="mt-8 space-y-1">
        {TABS.map(([id, icon, label]) => <a key={id} href={`#/${id === "home" ? "" : id}`} className={`side-item ${tab === id ? "side-item-active" : ""}`}><Icon name={icon} size={19} />{label}</a>)}
        <a href="#/shopping" className={`side-item ${tab === "shopping" ? "side-item-active" : ""}`}><Icon name="bag" size={19} /><span className="flex-1">Shopping list</span>{toBuy > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-coral px-1.5 text-[.65rem] text-white">{toBuy}</span>}</a>
      </nav>
      <div className="mt-auto space-y-3">
        {isLocalMode && <div className="rounded-2xl bg-sand p-3 text-xs leading-5 text-muted"><b className="text-ink">Local mode.</b> Data is saved in this browser only. Add Supabase keys to sync.</div>}
        <button onClick={() => navigate("/profile")} className="flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-white"><span className="grid size-9 place-items-center rounded-full bg-forest text-xs font-bold text-white">{initials}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold">{profile.name || "Me"}</span></button>
      </div>
    </aside>

    <div className="min-w-0 pb-24 lg:pb-0">{children}</div>

    {/* Phone tab bar */}
    <nav className="tab-bar lg:hidden">{TABS.map(([id, icon, label]) => <a key={id} href={`#/${id === "home" ? "" : id}`} className={`tab-item ${tab === id ? "text-coral" : "text-muted"}`}><Icon name={icon} size={20} /><span>{label}</span></a>)}</nav>
  </div>;
}
