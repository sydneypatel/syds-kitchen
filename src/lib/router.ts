import { useEffect, useState } from "react";
import type { RecipeDraft } from "./types";

export type Route = { path: string[]; query: URLSearchParams };

function parse(): Route {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [p, q = ""] = raw.split("?");
  return { path: p.split("/").filter(Boolean), query: new URLSearchParams(q) };
}

export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

export function navigate(to: string) {
  window.location.hash = to.startsWith("/") ? to : `/${to}`;
}

export function back(fallback = "/") {
  if (window.history.length > 1) window.history.back();
  else navigate(fallback);
}

/** Unsaved recipe previews (AI ideas, TheMealDB results) live here until you save them. */
const drafts = new Map<string, RecipeDraft>();
export function putDraft(d: RecipeDraft) {
  const id = crypto.randomUUID().slice(0, 8);
  drafts.set(id, d);
  return id;
}
export function getDraft(id: string) {
  return drafts.get(id);
}
