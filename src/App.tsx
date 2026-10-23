import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Shell, type Tab } from "./components/Shell";
import { Button, Logo, Toaster } from "./components/ui";
import { localBackend, supabase, supabaseBackend, type Backend } from "./lib/backend";
import { useRoute } from "./lib/router";
import { StoreProvider, useStore } from "./lib/store";
import type { Data } from "./lib/types";
import { Browse } from "./screens/Browse";
import { Favorites } from "./screens/Favorites";
import { Home } from "./screens/Home";
import { Ingredients } from "./screens/Ingredients";
import { Login } from "./screens/Login";
import { MealOptions } from "./screens/MealOptions";
import { Onboarding } from "./screens/Onboarding";
import { Plan } from "./screens/Plan";
import { Profile } from "./screens/Profile";
import { RecipeForm } from "./screens/RecipeForm";
import { Recipes } from "./screens/Recipes";
import { RecipeView } from "./screens/RecipeView";
import { Shopping } from "./screens/Shopping";

function Splash({ error, retry }: { error?: string; retry?: () => void }) {
  return <div className="grid min-h-dvh place-items-center bg-cream p-6 text-center"><div><div className="flex justify-center"><Logo /></div>{error ? <><p className="mt-5 max-w-sm text-sm text-muted">{error}</p>{retry && <Button onClick={retry} className="mt-4">Try again</Button>}</> : <div className="mx-auto mt-6 size-6 animate-spin rounded-full border-2 border-coral border-t-transparent" />}</div></div>;
}

function Routes({ email }: { email: string | null }) {
  const { profile, error, clearError } = useStore();
  const { path, query } = useRoute();
  if (!profile.onboarded) return <Onboarding />;

  const [a, b, c] = path;
  let tab: Tab | null = null;
  let screen;
  switch (a) {
    case undefined: tab = "home"; screen = <Home />; break;
    case "options": tab = "home"; screen = <MealOptions minutes={Number(query.get("m")) || 45} />; break;
    case "ingredients": tab = "ingredients"; screen = <Ingredients />; break;
    case "recipes": tab = "recipes"; screen = <Recipes />; break;
    case "browse": tab = "recipes"; screen = <Browse />; break;
    case "new": tab = "recipes"; screen = <RecipeForm />; break;
    case "recipe": tab = "recipes"; screen = c === "edit" ? <RecipeForm key={b} id={b} /> : <RecipeView key={b} id={b} />; break;
    case "draft": tab = "recipes"; screen = <RecipeView key={b} draftId={b} />; break;
    case "plan": tab = "plan"; screen = <Plan />; break;
    case "shopping": tab = "shopping"; screen = <Shopping />; break;
    case "favorites": tab = "favorites"; screen = <Favorites />; break;
    case "profile": tab = "profile"; screen = <Profile email={email} />; break;
    default: tab = "home"; screen = <Home />;
  }
  return <Shell tab={tab}>
    {error && <div className="sticky top-0 z-30 flex items-center gap-3 bg-coral px-5 py-2.5 text-sm font-semibold text-white"><span className="flex-1">Couldn't save a change: {error}</span><button onClick={clearError} className="underline">Dismiss</button></div>}
    {screen}
  </Shell>;
}

function Loaded({ backend, email }: { backend: Backend; email: string | null }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = () => {
    setError(null);
    backend.load().then(setData).catch((e: Error) => setError(e.message.includes("does not exist") ? "Your Supabase tables aren't set up yet. Run supabase/schema.sql in the Supabase SQL editor." : e.message));
  };
  useEffect(load, [backend]);
  if (error) return <Splash error={error} retry={load} />;
  if (!data) return <Splash />;
  return <StoreProvider initial={data} backend={backend}><Routes email={email} /><Toaster /></StoreProvider>;
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(supabase ? undefined : null);
  const [local] = useState(() => (supabase ? null : localBackend()));

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  const [remote, setRemote] = useState<Backend | null>(null);
  useEffect(() => {
    setRemote(supabase && session && userId ? supabaseBackend(supabase, userId, session.user.email ?? "") : null);
    // only rebuild when the user changes, not on every token refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (local) return <Loaded backend={local} email={null} />;
  if (session === undefined) return <Splash />;
  if (!session) return <Login />;
  if (!remote) return <Splash />;
  return <Loaded key={userId} backend={remote} email={session.user.email ?? null} />;
}
