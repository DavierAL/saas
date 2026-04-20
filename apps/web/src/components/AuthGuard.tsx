import { ReactNode, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * AuthGuard component to protect routes.
 * Currently it checks if there is a session in Supabase.
 * If not, it could redirect to /login (placeholder logic for now).
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100vw', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)'
      }}>
        Cargando sesión...
      </div>
    );
  }

  // NOTE: For now, we allow access even without session to not block development,
  // but we log if there is no session. 
  // Future: if (!session) return <Navigate to="/login" />
  if (!session) {
    console.warn('[AuthGuard] No active session found. In a real scenario, this would redirect to Login.');
  }

  return <>{children}</>;
}
