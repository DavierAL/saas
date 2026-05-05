import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@saas-pos/domain";
import type {
  IUserRepositoryPort,
  UserRole,
} from "@saas-pos/application";

export class SupabaseUserRepository implements IUserRepositoryPort {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(tenantId: string): Promise<User[]> {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("email", { ascending: true });

    if (error) throw error;
    return data as User[];
  }

  async findById(id: string, tenantId: string): Promise<User | null> {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as User | null;
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as User | null;
  }

  async insert(data: {
    email: string;
    passwordHash: string;
    role: UserRole;
    tenantId: string;
  }): Promise<User> {
    const { data: inserted, error } = await this.client
      .from("users")
      .insert({
        email: data.email,
        password_hash: data.passwordHash,
        role: data.role,
        tenant_id: data.tenantId,
      })
      .select()
      .single();

    if (error) throw error;
    return inserted as User;
  }

  async updateRole(
    id: string,
    role: UserRole,
    tenantId: string,
  ): Promise<void> {
    const { error } = await this.client
      .from("users")
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null);

    if (error) throw error;
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    const { error } = await this.client
      .from("users")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) throw error;
  }
}