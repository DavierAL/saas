import type { Order, OrderStatus } from "@saas-pos/domain";
import { isValidOrderTransition, ValidationError } from "@saas-pos/domain";
import type { IOrderRepositoryPort } from "../ports/order-repository.port";

export interface UpdateOrderStatusInput {
  readonly status: OrderStatus;
}

export const updateOrderStatus = async (
  order: Order,
  targetStatus: OrderStatus,
  repo: IOrderRepositoryPort,
): Promise<void> => {
  if (!isValidOrderTransition(order.status, targetStatus)) {
    throw new ValidationError(
      `No se puede cambiar de ${order.status} a ${targetStatus}`,
      "status",
    );
  }

  await repo.updateStatus(order.id, targetStatus, order.tenant_id);
};

export const cancelOrder = async (
  order: Order,
  repo: IOrderRepositoryPort,
): Promise<void> => {
  if (!isValidOrderTransition(order.status, "cancelled")) {
    throw new ValidationError(
      `No se puede cancelar una orden en estado "${order.status}"`,
      "status",
    );
  }

  await repo.updateStatus(order.id, "cancelled", order.tenant_id);
};

export const refundOrder = async (
  order: Order,
  repo: IOrderRepositoryPort,
): Promise<void> => {
  if (!isValidOrderTransition(order.status, "refunded")) {
    throw new ValidationError(
      `No se puede reembolsar una orden en estado "${order.status}"`,
      "status",
    );
  }

  await repo.updateStatus(order.id, "refunded", order.tenant_id);
};

export const voidOrder = async (
  order: Order,
  repo: IOrderRepositoryPort,
): Promise<void> => {
  if (!isValidOrderTransition(order.status, "voided")) {
    throw new ValidationError(
      `No se puede anular una orden en estado "${order.status}"`,
      "status",
    );
  }

  await repo.updateStatus(order.id, "voided", order.tenant_id);
};