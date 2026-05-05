import {
  listUsers,
  getUserById,
  createUser,
  updateUserRole,
  deleteUser,
  CreateUserInput,
} from '../use-cases/manage-users';
import type { IUserRepositoryPort } from '../ports/user-repository.port';
import type { UserRole } from '../ports/user-repository.port';
import type { User } from '@saas-pos/domain';

// ─── Mock Repository ─────────────────────────────────────────────
let userRepo: jest.Mocked<IUserRepositoryPort>;

beforeEach(() => {
  userRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    insert: jest.fn(),
    updateRole: jest.fn(),
    softDelete: jest.fn(),
  };
});

// ─── Tests listUsers ───────────────────────────────────────────────
describe('listUsers', () => {
  test('returns users from repository', async () => {
    const mockUsers: User[] = [
      {
        id: 'user-1',
        tenant_id: 'tenant-1',
        email: 'admin@test.com',
        role: 'admin',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        deleted_at: null,
      },
    ];
    userRepo.findAll.mockResolvedValue(mockUsers);

    const result = await listUsers('tenant-1', userRepo);

    expect(userRepo.findAll).toHaveBeenCalledWith('tenant-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.email).toBe('admin@test.com');
  });

  test('returns empty array when no users', async () => {
    userRepo.findAll.mockResolvedValue([]);

    const result = await listUsers('tenant-1', userRepo);

    expect(result).toHaveLength(0);
  });
});

// ─── Tests getUserById ─────────────────────────────────────────
describe('getUserById', () => {
  test('returns user by id', async () => {
    const mockUser: User = {
      id: 'user-1',
      tenant_id: 'tenant-1',
      email: 'admin@test.com',
      role: 'admin',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
      deleted_at: null,
    };
    userRepo.findById.mockResolvedValue(mockUser);

    const result = await getUserById('user-1', 'tenant-1', userRepo);

    expect(userRepo.findById).toHaveBeenCalledWith('user-1', 'tenant-1');
    expect(result?.email).toBe('admin@test.com');
  });

  test('returns null when user not found', async () => {
    userRepo.findById.mockResolvedValue(null);

    const result = await getUserById('user-1', 'tenant-1', userRepo);

    expect(result).toBeNull();
  });
});

// ─── Tests createUser ─────────────────────────────────────────────
describe('createUser', () => {
  const validInput: CreateUserInput = {
    email: 'newuser@test.com',
    password: 'password123',
    role: 'cashier',
  };

  const mockHashPassword = jest.fn().mockResolvedValue('hashed_password');
  const deps = { hashPassword: mockHashPassword };

  test('creates user with valid input', async () => {
    const mockUser: User = {
      id: 'user-new',
      tenant_id: 'tenant-1',
      email: 'newuser@test.com',
      role: 'cashier',
      created_at: '2026-05-04',
      updated_at: '2026-05-04',
      deleted_at: null,
    };
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.insert.mockResolvedValue(mockUser);

    const result = await createUser(validInput, 'tenant-1', userRepo, deps);

    expect(userRepo.findByEmail).toHaveBeenCalledWith('newuser@test.com', 'tenant-1');
    expect(userRepo.insert).toHaveBeenCalled();
    expect(result.email).toBe('newuser@test.com');
  });

  test('rejects empty email', async () => {
    const input = { ...validInput, email: '' };

    const promise = createUser(input, 'tenant-1', userRepo, deps);

    await expect(promise).rejects.toThrow('El email no puede estar vacío');
  });

  test('rejects invalid email format', async () => {
    const input = { ...validInput, email: 'not-an-email' };

    const promise = createUser(input, 'tenant-1', userRepo, deps);

    await expect(promise).rejects.toThrow('El email no tiene un formato válido');
  });

  test('rejects short password', async () => {
    const input = { ...validInput, password: '123' };

    const promise = createUser(input, 'tenant-1', userRepo, deps);

    await expect(promise).rejects.toThrow('La contraseña debe tener al menos 6 caracteres');
  });

  test('rejects invalid role', async () => {
    const input = { ...validInput, role: 'invalid_role' as UserRole };

    const promise = createUser(input, 'tenant-1', userRepo, deps);

    await expect(promise).rejects.toThrow('Rol inválido');
  });

  test('rejects duplicate email', async () => {
    const mockExisting: User = {
      id: 'user-exists',
      tenant_id: 'tenant-1',
      email: 'newuser@test.com',
      role: 'admin',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
      deleted_at: null,
    };
    userRepo.findByEmail.mockResolvedValue(mockExisting);

    const promise = createUser(validInput, 'tenant-1', userRepo, deps);

    await expect(promise).rejects.toThrow('Ya existe un usuario con este email');
  });

  test('normalizes email to lowercase', async () => {
    const input = { ...validInput, email: 'UPPER@test.com' };
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.insert.mockResolvedValue({} as User);

    await createUser(input, 'tenant-1', userRepo, deps);

    const insertCall = userRepo.insert.mock.calls[0]![0];
    expect(insertCall.email).toBe('upper@test.com');
  });

  test('trims whitespace from email', async () => {
    const input = { ...validInput, email: '  test@test.com  ' };
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.insert.mockResolvedValue({} as User);

    await createUser(input, 'tenant-1', userRepo, deps);

    const insertCall = userRepo.insert.mock.calls[0]![0];
    expect(insertCall.email).toBe('test@test.com');
  });
});

// ─── Tests updateUserRole ───────────────────────────────────────
describe('updateUserRole', () => {
  test('updates role successfully', async () => {
    userRepo.updateRole.mockResolvedValue(undefined);

    await updateUserRole('user-1', { role: 'waiter' }, 'tenant-1', userRepo);

    expect(userRepo.updateRole).toHaveBeenCalledWith('user-1', 'waiter', 'tenant-1');
  });

  test('rejects invalid role', async () => {
    const promise = updateUserRole('user-1', { role: 'invalid' as UserRole }, 'tenant-1', userRepo);

    await expect(promise).rejects.toThrow('Rol inválido');
  });

  test('accepts all valid roles', async () => {
    const roles: UserRole[] = ['admin', 'cashier', 'waiter'];

    for (const role of roles) {
      userRepo.updateRole.mockResolvedValue(undefined);
      await updateUserRole('user-1', { role }, 'tenant-1', userRepo);
      expect(userRepo.updateRole).toHaveBeenCalled();
    }
  });
});

// ─── Tests deleteUser ───────────────────────────────────────────────
describe('deleteUser', () => {
  test('soft deletes user', async () => {
    userRepo.softDelete.mockResolvedValue(undefined);

    await deleteUser('user-1', 'tenant-1', userRepo);

    expect(userRepo.softDelete).toHaveBeenCalledWith('user-1', 'tenant-1');
  });

  test('returns void on success', async () => {
    userRepo.softDelete.mockResolvedValue(undefined);

    const result = await deleteUser('user-1', 'tenant-1', userRepo);

    expect(result).toBeUndefined();
  });
});