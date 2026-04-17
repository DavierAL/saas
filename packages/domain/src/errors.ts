/**
 * Domain Error Hierarchy  [DOM-005]
 *
 * Typed errors allow callers to distinguish failure modes in a catch block.
 * All domain errors carry a `code` string for logging and telemetry.
 *
 * Usage:
 *   catch (e) {
 *     if (e instanceof InsufficientStockError) { ... }
 *     if (e instanceof SubscriptionExpiredError) { ... }
 *   }
 */

export class DomainError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    // Maintain proper prototype chain in transpiled environments
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SubscriptionExpiredError extends DomainError {
  readonly tenantId: string;
  constructor(tenantId: string) {
    super(`Subscription expired for tenant ${tenantId}`, 'SUBSCRIPTION_EXPIRED');
    this.name = 'SubscriptionExpiredError';
    this.tenantId = tenantId;
  }
}

export class InsufficientStockError extends DomainError {
  readonly itemId: string;
  readonly available: number;
  readonly requested: number;
  constructor(itemId: string, available: number, requested: number) {
    super(
      `Insufficient stock for item ${itemId}: available=${available}, requested=${requested}`,
      'INSUFFICIENT_STOCK',
    );
    this.name = 'InsufficientStockError';
    this.itemId = itemId;
    this.available = available;
    this.requested = requested;
  }
}

export class ValidationError extends DomainError {
  readonly field?: string;
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NotFoundError extends DomainError {
  readonly entityType: string;
  readonly entityId: string;
  constructor(entityType: string, entityId: string) {
    super(`${entityType} not found: ${entityId}`, 'NOT_FOUND');
    this.name = 'NotFoundError';
    this.entityType = entityType;
    this.entityId = entityId;
  }
}
