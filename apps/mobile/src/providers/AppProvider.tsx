/**
 * AppProvider — top-level context provider tree.
 *
 * Order matters:
 *   PowerSyncProvider (DB context)
 *     └─ children (entire app)
 *
 * DatabaseProvider initializes SQLite + PowerSync sync on mount.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { PowerSyncContext } from '@powersync/react-native';
import { initDatabase, getDatabase } from '../lib/powersync/database';
import type { PowerSyncDatabase } from '@powersync/react-native';

// ─── Auth Context ────────────────────────────────────────────
interface AuthContextValue {
  isAuthenticated: boolean;
  tenantId: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  tenantId: null,
});

export const useAuth = () => useContext(AuthContext);

// ─── Database Provider ───────────────────────────────────────
interface DatabaseProviderProps {
  children: React.ReactNode;
}

function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [db, setDb] = useState<PowerSyncDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    initDatabase()
      .then((database) => {
        if (!cancelled) {
          setDb(database);
          setIsReady(true);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          console.error('[DatabaseProvider] init failed:', err);
          setError(err.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    // In production, render an error screen
    // For now, bubble the error to the console
    console.error('[DatabaseProvider] Fatal error:', error);
    return null;
  }

  if (!isReady || !db) {
    // DB is initializing — children should show a skeleton/loader
    // We pass null; hooks will return empty arrays during this time
    return null;
  }

  return (
    <PowerSyncContext.Provider value={db}>
      {children}
    </PowerSyncContext.Provider>
  );
}

// ─── Root AppProvider ─────────────────────────────────────────
interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Auth state: in Phase 1 we use a hardcoded demo session
  // Phase 2 will replace this with real Supabase auth
  const authValue: AuthContextValue = {
    isAuthenticated: true,
    tenantId: '00000000-0000-0000-0000-000000000001',
  };

  return (
    <AuthContext.Provider value={authValue}>
      <DatabaseProvider>
        {children}
      </DatabaseProvider>
    </AuthContext.Provider>
  );
}
