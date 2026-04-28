import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function useTenantId() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function getTenant() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const tid = user.user_metadata?.tenant_id;

        if (!tid) {
          console.warn("User has no tenant_id, redirecting to onboarding");
          navigate("/onboarding");
          return;
        }

        setTenantId(tid);
      } catch (error) {
        console.error("Error fetching tenant_id:", error);
      } finally {
        setLoading(false);
      }
    }

    getTenant();
  }, [navigate]);

  return { tenantId, loading };
}
