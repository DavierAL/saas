import type { User } from "@saas-pos/domain";
import type {
  IUserRepositoryPort,
  UserRole,
} from "../ports/user-repository.port";

export interface CreateUserInput {
  readonly email: string;
  readonly password: string;
  readonly role: UserRole;
}

export interface UpdateUserRoleInput {
  readonly role: UserRole;
}

export const listUsers = async (
  tenantId: string,
  repo: IUserRepositoryPort,
): Promise<User[]> => repo.findAll(tenantId);

export const getUserById = async (
  id: string,
  tenantId: string,
  repo: IUserRepositoryPort,
): Promise<User | null> => repo.findById(id, tenantId);

export const createUser = async (
  input: CreateUserInput,
  tenantId: string,
  repo: IUserRepositoryPort,
  deps: { hashPassword: (password: string) => Promise<string> },
): Promise<User> => {
  const trimmedEmail = input.email.trim();
  if (trimmedEmail.length === 0) {
    throw new Error("El email no puede estar vacío.");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    throw new Error("El email no tiene un formato válido.");
  }
  if (input.password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }
  const validRoles: UserRole[] = ["admin", "cashier", "waiter", "barber"];
  if (!validRoles.includes(input.role)) {
    throw new Error("Rol inválido. Debe ser admin, cashier, waiter o barber.");
  }

  const existing = await repo.findByEmail(trimmedEmail, tenantId);
  if (existing) {
    throw new Error("Ya existe un usuario con este email.");
  }

  const passwordHash = await deps.hashPassword(input.password);
  return repo.insert({
    email: trimmedEmail.toLowerCase(),
    passwordHash,
    role: input.role,
    tenantId,
  });
};

export const updateUserRole = async (
  id: string,
  input: UpdateUserRoleInput,
  tenantId: string,
  repo: IUserRepositoryPort,
): Promise<void> => {
  const validRoles: UserRole[] = ["admin", "cashier", "waiter", "barber"];
  if (!validRoles.includes(input.role)) {
    throw new Error("Rol inválido.");
  }
  await repo.updateRole(id, input.role, tenantId);
};

export const deleteUser = async (
  id: string,
  tenantId: string,
  repo: IUserRepositoryPort,
): Promise<void> => repo.softDelete(id, tenantId);