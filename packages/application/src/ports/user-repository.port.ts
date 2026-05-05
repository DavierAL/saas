import type { User } from "@saas-pos/domain";

export type UserRole = "admin" | "cashier" | "waiter";

export interface IUserRepositoryPort {
  findAll(tenantId: string): Promise<User[]>;
  findById(id: string, tenantId: string): Promise<User | null>;
  findByEmail(email: string, tenantId: string): Promise<User | null>;
  insert(data: {
    email: string;
    passwordHash: string;
    role: UserRole;
    tenantId: string;
  }): Promise<User>;
  updateRole(id: string, role: UserRole, tenantId: string): Promise<void>;
  softDelete(id: string, tenantId: string): Promise<void>;
}