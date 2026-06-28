"use client";

import * as React from "react";
import type { RoleId } from "./types";
import { roleMeta, navDef } from "./rbac";

/** The authenticated user, as returned by POST /auth/login. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  branch: string;
  label: string;
  token: string;
}

interface SessionState {
  authed: boolean;
  role: RoleId;
  navCollapsed: boolean;
  /** Present after a real sign-in; drives the displayed identity. */
  user: AuthUser | null;
}

interface SessionContextValue extends SessionState {
  login: (user: AuthUser) => void;
  logout: () => void;
  setRole: (role: RoleId) => void;
  toggleNav: () => void;
  /** Default landing route for the active role. */
  homeFor: (role: RoleId) => string;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);

const STORAGE_KEY = "malta-session";

function homeForRole(role: RoleId): string {
  const allowed = navDef.filter((n) => n.roles.includes(role));
  return allowed[0]?.href ?? "/";
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<SessionState>({
    authed: false,
    role: "officer",
    navCollapsed: false,
    user: null,
  });
  const [hydrated, setHydrated] = React.useState(false);

  // Restore a prior session so a refresh doesn't bounce the user to login.
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot restore from browser storage
      if (raw) setState((s) => ({ ...s, ...JSON.parse(raw) }));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, hydrated]);

  const value = React.useMemo<SessionContextValue>(
    () => ({
      ...state,
      login: (user) =>
        setState((s) => ({ ...s, authed: true, role: user.role, user })),
      logout: () => setState((s) => ({ ...s, authed: false, user: null })),
      setRole: (role) => setState((s) => ({ ...s, role })),
      toggleNav: () => setState((s) => ({ ...s, navCollapsed: !s.navCollapsed })),
      homeFor: homeForRole,
    }),
    [state],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

/**
 * Display meta for the active role. When a real user is signed in, their name
 * and branch take precedence over the generic role defaults; the label still
 * follows the active "View as" role.
 */
export function useRoleMeta() {
  const { role, user } = useSession();
  const base = roleMeta[role];
  return {
    role,
    label: base.label,
    name: user?.name ?? base.name,
    branch: user?.branch ?? base.branch,
  };
}
