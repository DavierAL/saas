/**
 * ItemRepository — SQLite implementation
 *
 * All writes go through PowerSync's db.execute() which:
 *   1. Writes to local SQLite immediately (zero latency UI)
 *   2. Queues the mutation in the outbox for sync to Supabase
 *
 * All reads use SQLite directly (offline-first).
 */
import { IItemRepositoryPort } from '@saas-pos/application';
import type { PowerSyncDatabase } from '@powersync/react-native';
import type { Item, ItemType } from '@saas-pos/domain';
import { generateId, nowISO } from '@saas-pos/utils';

export class SqliteItemRepository implements IItemRepositoryPort {
  constructor(private readonly db: PowerSyncDatabase) {}

  async findAll(tenantId: string): Promise<Item[]> {
    const rows = await this.db.getAll<Item>(
      `SELECT id, tenant_id, type, name, price, stock,
              created_at, updated_at, deleted_at
       FROM items
       WHERE tenant_id = ? AND deleted_at IS NULL
       ORDER BY name ASC`,
      [tenantId],
    );
    return rows;
  }

  async findById(id: string, tenantId: string): Promise<Item | null> {
    const row = await this.db.getOptional<Item>(
      `SELECT id, tenant_id, type, name, price, stock,
              created_at, updated_at, deleted_at
       FROM items WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
      [id, tenantId],
    );
    return row ?? null;
  }

  async findByType(type: ItemType, tenantId: string): Promise<Item[]> {
    return this.db.getAll<Item>(
      `SELECT id, tenant_id, type, name, price, stock,
              created_at, updated_at, deleted_at
       FROM items
       WHERE tenant_id = ? AND type = ? AND deleted_at IS NULL
       ORDER BY name ASC`,
      [tenantId, type],
    );
  }

  async insert(
    data: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
    tenantId: string,
  ): Promise<Item> {
    const item: Item = {
      id:         generateId(),
      tenant_id:  tenantId,
      type:       data.type,
      name:       data.name,
      price:      data.price,
      stock:      data.stock,
      created_at: nowISO(),
      updated_at: nowISO(),
      deleted_at: null,
    };

    await this.db.execute(
      `INSERT INTO items (id, tenant_id, type, name, price, stock, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.id, item.tenant_id, item.type, item.name, item.price, item.stock, item.created_at, item.updated_at],
    );

    return item;
  }

  async update(
    id: string,
    patch: Partial<Pick<Item, 'name' | 'price' | 'stock'>>,
    tenantId: string,
  ): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (patch.name  !== undefined) { fields.push('name = ?');  values.push(patch.name); }
    if (patch.price !== undefined) { fields.push('price = ?'); values.push(patch.price); }
    if (patch.stock !== undefined) { fields.push('stock = ?'); values.push(patch.stock); }

    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    values.push(nowISO());
    values.push(id, tenantId);

    await this.db.execute(
      `UPDATE items SET ${fields.join(', ')}
       WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
      values,
    );
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    await this.db.execute(
      `UPDATE items SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND tenant_id = ?`,
      [nowISO(), nowISO(), id, tenantId],
    );
  }

  /**
   * Atomically decrements stock for a product.
   * Fails silently (no-op) if item is a service (stock = NULL).
   * The calling code (checkout) should validate stock before calling this.
   */
  async decrementStock(id: string, quantity: number, tenantId: string): Promise<void> {
    await this.db.execute(
      `UPDATE items
       SET stock = stock - ?, updated_at = ?
       WHERE id = ? AND tenant_id = ? AND type = 'product' AND stock IS NOT NULL`,
      [quantity, nowISO(), id, tenantId],
    );
  }
}
