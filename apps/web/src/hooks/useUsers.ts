import { useState, useEffect, useCallback } from "react";
import type { User, UserRole } from "@saas-pos/domain";
import { useCases } from "../lib/use-cases";
import { supabase } from "../lib/supabase";

type UserFormData = {
  email: string;
  password: string;
  role: UserRole;
};

export function useUsers(tenantId: string | null, roleFilter: UserRole | "all" = "all") {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const allUsers = await useCases.users.findAll(tenantId);
      const filtered = roleFilter !== "all" ? allUsers.filter((u) => u.role === roleFilter) : allUsers;
      setUsers(filtered);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, [tenantId, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const createUser = async (formData: UserFormData) => {
    if (!tenantId) return;
    setSubmitting(true);
    try {
      await useCases.users.createUser(
        { email: formData.email, password: formData.password, role: formData.role },
        tenantId,
        {
          hashPassword: async (pwd: string) => {
            const { data, error } = await supabase.auth.admin.generateLink({
              type: "signup",
              email: formData.email,
              password: pwd,
            });
            if (error) throw error;
            return data.properties?.hashed_token || "stub";
          },
        }
      );
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "Error al crear usuario");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    if (!tenantId) return;
    setSubmitting(true);
    try {
      await useCases.users.updateUserRole(userId, { role }, tenantId);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "Error al actualizar rol");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!tenantId) return;
    setSubmitting(true);
    try {
      await useCases.users.deleteUser(userId, tenantId);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "Error al desactivar usuario");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = useCallback(() => setError(null), []);

  return {
    users,
    loading,
    error,
    submitting,
    createUser,
    updateUserRole,
    deleteUser,
    refetch: loadUsers,
    clearError,
  };
}

export function getEmptyUserFormData() {
  return { email: "", password: "", role: "cashier" as UserRole };
}