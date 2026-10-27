import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_PROFILE, type Data, type Profile, type TableName, type Tables } from "./types";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** When Supabase isn't configured, the app runs in "local mode" and saves to this browser. */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;
export const isLocalMode = !supabase;

export interface Backend {
  load(): Promise<Data>;
  insert<T extends TableName>(table: T, row: Tables[T]): Promise<void>;
  update<T extends TableName>(table: T, id: string, patch: Partial<Tables[T]>): Promise<void>;
  remove(table: TableName, ids: string[]): Promise<void>;
  saveProfile(profile: Profile): Promise<void>;
}

/* ---------------- Supabase ---------------- */

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export function supabaseBackend(sb: SupabaseClient, userId: string, email: string): Backend {
  return {
    async load() {
      const [profile, recipes, pantry, shopping, plan] = await Promise.all([
        sb.from("profiles").select("*").eq("id", userId).maybeSingle(),
        sb.from("recipes").select("*").order("created_at", { ascending: false }),
        sb.from("pantry_items").select("*").order("created_at", { ascending: true }),
        sb.from("shopping_items").select("*").order("created_at", { ascending: true }),
        sb.from("plan_entries").select("*").order("created_at", { ascending: true }),
      ]);
      let p = check(profile) as Profile | null;
      if (!p) {
        // First sign-in: create the profile. ignoreDuplicates makes this safe if two loads race
        // (or a profile already exists), then re-read so we always use the stored row.
        const fresh = { ...DEFAULT_PROFILE, id: userId, name: email.split("@")[0] };
        check(await sb.from("profiles").upsert(fresh, { onConflict: "id", ignoreDuplicates: true }));
        p = (check(await sb.from("profiles").select("*").eq("id", userId).maybeSingle()) as Profile | null) ?? fresh;
      }
      return {
        profile: p,
        recipes: check(recipes) ?? [],
        pantry_items: check(pantry) ?? [],
        shopping_items: check(shopping) ?? [],
        plan_entries: check(plan) ?? [],
      };
    },
    async insert(table, row) {
      check(await sb.from(table).insert(row));
    },
    async update(table, id, patch) {
      check(await sb.from(table).update(patch as never).eq("id", id));
    },
    async remove(table, ids) {
      if (ids.length) check(await sb.from(table).delete().in("id", ids));
    },
    async saveProfile(profile) {
      check(await sb.from("profiles").upsert(profile));
    },
  };
}

/* ---------------- Local (browser) ---------------- */

const KEY = "syds-kitchen:data:v1";

function read(): Data {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Data;
  } catch {
    /* ignore */
  }
  return { profile: { ...DEFAULT_PROFILE, id: "local", name: "" }, recipes: [], pantry_items: [], shopping_items: [], plan_entries: [] };
}

function write(data: Data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function localBackend(): Backend {
  return {
    async load() {
      return read();
    },
    async insert(table, row) {
      const d = read();
      (d[table] as unknown[]).push(row);
      write(d);
    },
    async update(table, id, patch) {
      const d = read();
      d[table] = (d[table] as { id: string }[]).map((r) => (r.id === id ? { ...r, ...patch } : r)) as never;
      write(d);
    },
    async remove(table, ids) {
      const d = read();
      d[table] = (d[table] as { id: string }[]).filter((r) => !ids.includes(r.id)) as never;
      write(d);
    },
    async saveProfile(profile) {
      const d = read();
      d.profile = profile;
      write(d);
    },
  };
}
