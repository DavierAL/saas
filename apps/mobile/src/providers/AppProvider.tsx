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
import { initDatabase, getDatabase } from '../lib/powersync/database';
import { LoadingScreen } from '../components/LoadingScreen';
import {
  remoteValidateSubscription,
  validateSubscription,
} from '@saas-pos/application';
import {
  SqliteTenantRepository,
  SupabaseRemoteValidator,
} from '@saas-pos/db';


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
    if (typeof payload.iss === 'string') {
      try {
        const issHost = new URL(payload.iss).hostname;
        const expectedHost = new URL(supabaseUrl).hostname;
        if (issHost !== expectedHost) {
          console.warn(`[JWT] Issuer mismatch. Expected: ${expectedHost}, Got: ${issHost}`);
          return null;
        }
      } catch (err) {
        console.warn('[JWT] Invalid issuer URL format');
        return null;
      }
    }

    return payload;
  } catch {
    return null;
  }
};

// Extracts claims injected by custom_access_token_hook OR found in metadata
const extractClaim = (token: string | undefined, claim: string): string | null => {
  if (!token) return null;
  const payload = getValidJwtPayload(token);
  if (!payload) {
    return null;
  }

  // Priority: 1. Root claim (from hook), 2. app_metadata, 3. user_metadata
  const value = (payload[claim] as string) ?? 
                ((payload.app_metadata as any)?.[claim] as string) ??
                ((payload.user_metadata as any)?.[claim] as string) ??
                null;

  console.log(`[JWT] Extracted claim '${claim}':`, value);
  return value;
};

// ─── Auth Context ─────────────────────────────────────────────
export interface AuthContextValue {
  session: SupabaseSession | null;
  isLoading: boolean;
  tenantId: string | null;
  role: string | null;
  subscriptionWarning: string | null;
  isDbReady: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
  tenantId: null,
  role: null,
  subscriptionWarning: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ─── Sync Controller ──────────────────────────────────────────
/**
 * SyncController — manages PowerSync connection & remote validation.
 * It does NOT wrap children, so it doesn't cause the navigation tree to unmount.
 */
function SyncController({ 
  tenantId, 
  onWarning,
  onInitialized
}: { 
  tenantId: string | null; 
  onWarning: (warning: string | null) => void;
  onInitialized: () => void;
}) {
  useEffect(() => {
    if (!tenantId) return;
    
    let cancelled = false;
    const db = getDatabase();

    // ── Watch Sync Status ────────────────────────────────
    const statusUnsubscribe = db.onChange(({ status }) => {
      console.log('[SyncController] Status Change:', 
        status.connected ? 'Connected' : 'Disconnected', 
        `(hasSynced: ${status.hasSynced})`
      );
      if (status.lastError) {
        console.error('[SyncController] Sync Error:', status.lastError.message);
      }
    });

    initDatabase()
      .then(async (database) => {
        if (cancelled) return;
        console.log('[SyncController] PowerSync DB initialized and connected.');

        // ── Step 4: Periodic Remote Validation ────────────────
        const repo = new SqliteTenantRepository(database);
        const remoteValidator = new SupabaseRemoteValidator(supabase);
        
        console.log('[SyncController] Triggering remote validation for:', tenantId);
        remoteValidateSubscription(tenantId, {
          tenantRepo: repo,
          remoteValidator,
        }).then(async (remoteResult) => {
          if (cancelled) return;
          
          let status = await validateSubscription(tenantId, repo);
          
          // [FIX] If local DB doesn't have the tenant yet (sync pending), 
          // but we just got a valid remote result, use the remote result!
          if (!status.allowed && remoteResult) {
             const isValid = new Date(remoteResult.valid_until) > new Date();
             if (isValid) {
               console.log('[SyncController] Local DB empty, using remote result override.');
               status = {
                 allowed: true,
                 subscription: {
                   isActive: true,
                   daysRemaining: Math.floor((new Date(remoteResult.valid_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
                   hoursRemaining: 0,
                   isExpiringSoon: false
                 }
               };
             }
          }

          console.log('[SyncController] Remote validation finished. Status:', status.allowed ? 'Valid' : 'Invalid');
          onWarning(status.warning ?? null);
        }).catch(err => {
          console.warn('[SyncController] Remote validation failed:', err.message);
        });

        // Initial local check
        const initialStatus = await validateSubscription(tenantId, repo);
        onInitialized();
      })
      .catch((err: Error) => {
        console.error('[SyncController] init failed:', err.message);
        onInitialized(); // Still mark as initialized to avoid infinite loading, or handle error state
      });
    
    return () => { 
      cancelled = true; 
      statusUnsubscribe();
    };
  }, [tenantId]);

  return null;
}

// ─── App Provider ─────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  // undefined = still loading, null = no session, Session = authenticated
  const [session, setSession] = useState<SupabaseSession | null | undefined>(undefined);
  const [subscriptionWarning, setSubscriptionWarning] = useState<string | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    // 1. Load existing session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session))
      .catch(() => setSession(null));

    // 2. Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log(`[Auth] Auth state changed: ${event}`, !!newSession ? 'Session exists' : 'No session');
      setSession(newSession);
    });

    // 3. Expiration checker loop
    const interval = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (currentSession?.access_token) {
        const payload = getValidJwtPayload(currentSession.access_token);
        if (payload && typeof payload.exp === 'number') {
          const timeUntilExp = payload.exp - Math.floor(Date.now() / 1000);
          if (timeUntilExp > 0 && timeUntilExp < 300) {
            console.log('[Auth] Token expiring soon. Refreshing...');
            await supabase.auth.refreshSession();
          }
        }
      }
    }, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);
  const activeSession = session ?? null;
  const tenantId = extractClaim(activeSession?.access_token, 'tenant_id');
  const role     = extractClaim(activeSession?.access_token, 'role');

  const authValue: AuthContextValue = {
    session: activeSession,
    isLoading: session === undefined,
    tenantId,
    role,
    subscriptionWarning,
    isDbReady,
    signOut,
  };

  const db = getDatabase();

  // If session is undefined, we are still loading the initial auth state
  if (session === undefined) {
    return <LoadingScreen message="Iniciando sesión..." />;
  }

  return (
    <AuthContext.Provider value={authValue}>
      <PowerSyncContext.Provider value={db}>
        <SyncController 
          tenantId={tenantId} 
          onWarning={setSubscriptionWarning} 
          onInitialized={() => setIsDbReady(true)}
        />
        {children}
      </PowerSyncContext.Provider>
    </AuthContext.Provider>
  );
}

