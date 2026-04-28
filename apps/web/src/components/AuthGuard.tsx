import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setSession(session)
    )
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null  // cargando
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}
