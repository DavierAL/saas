/**
 * AppProvider — manages Supabase auth session and PowerSync DB lifecycle.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { PowerSyncContext } from "@powersync/react-native";
import { supabase } from "../lib/supabase/client";
import type { SupabaseSession } from "../lib/supabase/client";
import { initDatabase, getDatabase } from "../lib/powersync/database";
import { LoadingScreen } from "../components/LoadingScreen";
import {
  remoteValidateSubscription,
  validateSubscription,
} from "@saas-pos/application";
import { SqliteTenantRepository, SupabaseRemoteValidator } from "@saas-pos/db";

// ─── JWT Claim Extractor ──────────────────────────────────────
const getValidJwtPayload = (
  token: string | undefined,
): Record<string, unknown> | null => {
  if (!token) return null;
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(
      typeof atob !== "undefined"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf-8"),
    ) as Record<string, unknown>;

    if (typeof payload.exp === "number") {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) return null;
    }

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
    if (typeof payload.iss === "string") {
      try {
        const issHost = new URL(payload.iss).hostname;
        const expectedHost = new URL(supabaseUrl).hostname;
        if (issHost !== expectedHost) {
          console.warn(
            `[JWT] Issuer mismatch. Expected: ${expectedHost}, Got: ${issHost}`,
          );
          return null;
        }
      } catch {
        console.warn("[JWT] Invalid issuer URL format");
        return null;
      }
    }

    console.log("[JWT] Payload:", JSON.stringify(payload, null, 2));
    return payload;
  } catch (err) {
    console.error("[JWT] Decode error:", err);
    return null;
  }
};

const extractClaim = (
  token: string | undefined,
  claim: string,
): string | null => {
  if (!token) return null;
  const payload = getValidJwtPayload(token);
  if (!payload) return null;

  let value: string | null = null;
  let source = "none";

  if (payload[claim]) {
    value = payload[claim] as string;
    source = "root";
  } else if ((payload.app_metadata as any)?.[claim]) {
    value = (payload.app_metadata as any)[claim];
    source = "app_metadata";
  } else if ((payload.user_metadata as any)?.[claim]) {
    value = (payload.user_metadata as any)[claim];
    source = "user_metadata";
  }

  console.log(`[JWT] Extracted claim '${claim}':`, value, `(from ${source})`);
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
  hasSynced: boolean; // ← NUEVO: expuesto para que los screens esperen datos
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
  tenantId: null,
  role: null,
  subscriptionWarning: null,
  isDbReady: false,
  hasSynced: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ─── Sync Controller ──────────────────────────────────────────
function SyncController({
  tenantId,
  onWarning,
  onInitialized,
  onHasSynced,
}: {
  tenantId: string | null;
  onWarning: (warning: string | null) => void;
  onInitialized: () => void;
  onHasSynced: (synced: boolean) => void;
}) {
  // Ref para evitar correr validación dos veces si ya está corriendo
  const validationRunningRef = useRef(false);
  // Ref para saber si ya llamamos onInitialized
  const initializedRef = useRef(false);

  // ── Effect 1: Init PowerSync + escuchar status ──────────────
  // Usa el listener NATIVO de PowerSync para detectar hasSynced.
  // NO uses watch() aquí — watch() requiere que la DB ya esté inicializada.
  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    const db = getDatabase();

    // Registra listener ANTES de initDatabase para no perder el evento
    const removeListener = db.registerListener({
      statusChanged: (status) => {
        console.log(
          "[SyncController] Status Change:",
          status.connected ? "Connected" : "Disconnected",
          `(hasSynced: ${status.hasSynced})`,
        );

        if (status.hasSynced && !cancelled) {
          console.log(
            "[SyncController] ✅ hasSynced = true via status listener",
          );
          onHasSynced(true);
        }
      },
    });

    // Inicializa la DB
    initDatabase()
      .then(() => {
        if (cancelled) return;
        console.log("[SyncController] PowerSync initialized.");

        // Por si el evento ya ocurrió antes de que registráramos el listener
        if (db.currentStatus?.hasSynced) {
          console.log(
            "[SyncController] ✅ hasSynced = true (already synced on init)",
          );
          onHasSynced(true);
        }
      })
      .catch((err) => {
        console.error("[SyncController] init failed:", err.message);
        // Aún así desbloquea la app para no dejarla colgada
        if (!initializedRef.current) {
          initializedRef.current = true;
          onInitialized();
        }
      });

    return () => {
      cancelled = true;
      if (typeof removeListener === "function") removeListener();
      else if (removeListener && (removeListener as any).remove)
        (removeListener as any).remove();
    };
  }, [tenantId]);

  // ── Effect 2: Validación de suscripción ────────────────────
  // Corre inmediatamente (con fallback remoto) para no bloquear la app.
  // Si ya corrió exitosamente, no corre de nuevo innecesariamente.
  useEffect(() => {
    if (!tenantId) return;
    if (validationRunningRef.current) return;

    validationRunningRef.current = true;

    const runValidation = async () => {
      const db = getDatabase();
      const repo = new SqliteTenantRepository(db);
      const remoteValidator = new SupabaseRemoteValidator(supabase);

      try {
        // Siempre intenta remoto primero para velocidad
        const remoteResult = await remoteValidateSubscription(tenantId, {
          tenantRepo: repo,
          remoteValidator,
        });

        let status = await validateSubscription(tenantId, repo);

        // [DIAGNOSTIC] Verify local data presence
        const tCount = await db.execute("SELECT count(*) as c FROM tenants");
        const iCount = await db.execute("SELECT count(*) as c FROM items");
        console.log(
          `[SyncController] 📊 SQLite Stats: tenants=${tCount.rows?.item(0).c}, items=${iCount.rows?.item(0).c}`,
        );

        // [DEBUG] Internal PowerSync tables
        const tables = await db.getAll(
          `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`,
        );
        console.log("[DEBUG] Tablas SQLite:", JSON.stringify(tables));

        const buckets = await db.getAll(`SELECT * FROM ps_buckets LIMIT 5`);
        console.log("[DEBUG] PS Buckets:", JSON.stringify(buckets));

        const oplog = await db.getAll(`SELECT * FROM ps_oplog LIMIT 5`);
        console.log("[DEBUG] PS Oplog count:", oplog.length);

        if (iCount.rows?.item(0).c > 0) {
          const sample = await db.execute(
            "SELECT tenant_id FROM items LIMIT 1",
          );
          console.log(
            "[SyncController] 🔍 Sample item tenant_id:",
            sample.rows?.item(0).tenant_id,
          );
          console.log("[SyncController] 🔍 Current app tenant_id:", tenantId);
        }

        // Fallback: si la DB local está vacía (sync aún no completó)
        if (!status.allowed && remoteResult) {
          const isValid = new Date(remoteResult.valid_until) > new Date();
          if (isValid) {
            console.log(
              "[SyncController] Using remote result fallback (sync in progress).",
            );
            status = {
              allowed: true,
              subscription: {
                isActive: true,
                daysRemaining: Math.floor(
                  (new Date(remoteResult.valid_until).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24),
                ),
                hoursRemaining: 0,
                isExpiringSoon: false,
              },
            };
          }
        }

        onWarning(status.warning ?? null);
        console.log(
          "[SyncController] Validation complete. Allowed:",
          status.allowed,
        );
      } catch (err: any) {
        console.warn("[SyncController] Validation error:", err.message);
      } finally {
        validationRunningRef.current = false;
        if (!initializedRef.current) {
          initializedRef.current = true;
          onInitialized(); // Desbloquea la app UNA sola vez
        }
      }
    };

    runValidation();
  }, [tenantId]); // ← Solo depende de tenantId, NO de hasSynced

  return null;
}

// ─── App Provider ─────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SupabaseSession | null | undefined>(
    undefined,
  );
  const [subscriptionWarning, setSubscriptionWarning] = useState<string | null>(
    null,
  );
  const [isDbReady, setIsDbReady] = useState(false);
  const [hasSynced, setHasSynced] = useState(false); // ← NUEVO

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session))
      .catch(() => setSession(null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log(
        `[Auth] Auth state changed: ${event}`,
        !!newSession ? "Session exists" : "No session",
      );
      setSession(newSession);
    });

    const interval = setInterval(async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (currentSession?.access_token) {
        // [AUTH] Proactive check for expiration
        const payload = getValidJwtPayload(currentSession.access_token);
        const now = Math.floor(Date.now() / 1000);

        // If expired or expiring in < 5 mins, force refresh
        const isExpired =
          !payload || (payload.exp && (payload.exp as number) < now);
        const isExpiringSoon =
          payload && payload.exp && (payload.exp as number) - now < 300;

        if (isExpired || isExpiringSoon) {
          console.log("[Auth] Token invalid or expiring. Force refreshing...");
          await supabase.auth.refreshSession();
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

  const { tenantId, role } = React.useMemo(
    () => ({
      tenantId: extractClaim(activeSession?.access_token, "tenant_id"),
      role: extractClaim(activeSession?.access_token, "role"),
    }),
    [activeSession?.access_token],
  );

  const db = getDatabase();

  const authValue: AuthContextValue = {
    session: activeSession,
    isLoading: session === undefined,
    tenantId,
    role,
    subscriptionWarning,
    isDbReady,
    hasSynced, // ← expuesto
    signOut,
  };

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
          onHasSynced={setHasSynced} // ← NUEVO
        />
        {children}
      </PowerSyncContext.Provider>
    </AuthContext.Provider>
  );
}
