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
  ReactNode,
} from 'react';
import { PowerSyncContext } from '@powersync/react-native';
import type { PowerSyncDatabase } from '@powersync/react-native';
import { supabase } from '../lib/supabase/client';
import type { SupabaseSession } from '../lib/supabase/client';
import { initDatabase } from '../lib/powersync/database';

// ─── JWT Claim Extractor ──────────────────────────────────────
const getValidJwtPayload = (token: string | undefined): Record<string, unknown> | null => {
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

    // [AUTH-001] Validate token expiration (exp claim is in seconds)
    if (typeof payload.exp === 'number') {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) return null;
    }

    // [AUTH-001] Validate issuer (iss)
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const supabaseHost = supabaseUrl.replace(/^https?:\/\//, '').split('/')[0];
    if (supabaseHost && typeof payload.iss === 'string') {
      if (!payload.iss.includes(supabaseHost)) {
        console.warn(`[JWT] Issuer mismatch. Expected to contain: ${supabaseHost}`);
        return null; // Forged or unexpected token
      }
    }

    return payload;
  } catch {
    return null;
  }
};

// Extracts claims injected by custom_access_token_hook in auth-setup.sql
const extractClaim = (token: string | undefined, claim: string): string | null => {
  const payload = getValidJwtPayload(token);
  if (!payload) return null;
  return (payload[claim] as string) ?? null;
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
function DatabaseProvider({ children }: { children: any }) {
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
export function AppProvider({ children }: { children: any }) {
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

    // 3. [AUTH-002] Expiration checker loop
    const interval = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.access_token) {
        const payload = getValidJwtPayload(currentSession.access_token);
        // If exp exists, verify timeframe. If exp < now + 5 min, refresh.
        if (payload && typeof payload.exp === 'number') {
          const timeUntilExp = payload.exp - Math.floor(Date.now() / 1000);
          if (timeUntilExp > 0 && timeUntilExp < 300) {
            console.log('[Auth] Token expiring in less than 5m. Refreshing session...');
            await supabase.auth.refreshSession();
          }
        }
      }
    }, 60000); // Check every minute

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
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
