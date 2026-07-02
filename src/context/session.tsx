/**
 * session.tsx — MOCK přihlášení (žádný reálný auth). Jeden zdroj pravdy pro roli
 * uživatele; role-gated UI čte odtud. Přepíná se dev Tweaks panelem.
 * Později se provider vymění za reálný auth (Supabase) beze změny konzumentů.
 */
import { createContext, useContext, useState, type ReactNode } from "react";

export type Role = "reader" | "author" | "admin";

export interface SessionUser {
  name: string;
  role: Role;
  /** Slug veřejného profilu autora (pro /author/:slug). */
  slug?: string;
}

/** Výchozí mock — přihlášen jako autor „Křehy" (aby byl vidět přihlášený stav). */
export const MOCK_KREHY: SessionUser = { name: "Křehy", role: "author", slug: "krehy" };

/** Sestaví mock uživatele pro danou roli (pro Tweaks panel). */
export function mockUserForRole(role: Role): SessionUser {
  return { name: "Křehy", role, slug: "krehy" };
}

interface SessionValue {
  user: SessionUser | null;
  setUser: (u: SessionUser | null) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(MOCK_KREHY);
  return (
    <SessionContext.Provider value={{ user, setUser }}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within <SessionProvider>");
  return ctx;
}

/** Zkratka pro roli (null = odhlášen). */
export function useRole(): Role | null {
  return useSession().user?.role ?? null;
}
