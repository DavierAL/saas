/**
 * AppProvider — manages Supabase auth session and PowerSync DB lifecycle.
 *
 * Auth flow:
 *   1. On mount, load existing session from AsyncStorage
 *   2. Subscribe to Supabase auth state changes
 *   3. Extract tenant_id + role from JWT claims
 *   4. Initialize PowerSync DB only when session is valid
 *   5. AuthGuard (in _layout.tsx) routes based on session state
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { PowerSyncContext } from '@powersync/react-native';
import type { PowerSyncDatabase } from '@powersync/react-native';
import { supabase } from '../lib/supabase/client';
import type { SupabaseSession } from '../lib/supabase/client';
import { initDatabase } from '../lib/powersync/database';

// ─── JWT Claim Extractor ──────────────────────────────────────
// Extracts claims injected by custom_access_token_hook in auth-setup.sql
const extractClaim = (token: string | undefined, claim: string): string | null => {
  if (!token) return null;
  try {
    const base64 = token.split('.')[1];
    if (!base64) return null;
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(
      typeof atob !== 'undefined'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf-8'),
    ) as Record<string, unknown>;
    return (payload[claim] as string) ?? null;
  } catch {
    return null;
  }
};

// ─── Auth Context ─────────────────────────────────────────────
export interface AuthContextValue {
  session: SupabaseSession | null;
  isLoading: boolean;
  tenantId: string | null;
  role: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
  tenantId: null,
  role: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ─── Database Provider ────────────────────────────────────────
// Only mounts when we have a valid session (prevents unauthenticated DB init)
function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<PowerSyncDatabase | null>(null);

  useEffect(() => {
    let cancelled = false;

    initDatabase()
      .then((database) => {
        if (!cancelled) setDb(database);
      })
      .catch((err: Error) => {
        console.error('[DatabaseProvider] init failed:', err.message);
      });

    return () => { cancelled = true; };
  }, []);

  if (!db) {
    // DB initializing — hooks return empty arrays, UI shows skeletons
    return null;
  }

  return (
    <PowerSyncContext.Provider value={db}>
      {children}
    </PowerSyncContext.Provider>
  );
}

// ─── App Provider ─────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  // undefined = still loading, null = no session, Session = authenticated
  const [session, setSession] = useState<SupabaseSession | null | undefined>(undefined);

  useEffect(() => {
    // 1. Load existing session from AsyncStorage
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session))
      .catch(() => setSession(null));

    // 2. Subscribe to future auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const isLoading = session === undefined;
  const activeSession = session ?? null;

  const tenantId = extractClaim(activeSession?.access_token, 'tenant_id');
  const role     = extractClaim(activeSession?.access_token, 'role');

  const authValue: AuthContextValue = {
    session: activeSession,
    isLoading,
    tenantId,
    role,
    signOut,
  };

  return (
    <AuthContext.Provider value={authValue}>
      {/* DB only initializes once session is confirmed */}
      {activeSession ? (
        <DatabaseProvider>{children}</DatabaseProvider>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
