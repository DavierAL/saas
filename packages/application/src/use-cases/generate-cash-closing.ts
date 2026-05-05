/**
 * Generate cash closing report for a given date range.
 */
import type { Order } from '@saas-pos/domain';

export interface CashClosingSummary {
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  byPaymentMethod: Record<string, number>;
  byItemType: Record<string, number>;
}

export const generateCashClosing = (
  orders: Order[],
  startDate: Date,
  endDate: Date
): CashClosingSummary => {
  // Filter orders by date range and status
  const paidOrders = orders.filter(o => {
    if (o.status !== 'paid') return false;
    const orderDate = new Date(o.created_at);
    return orderDate >= startDate && orderDate <= endDate;
  });

  const totalSales = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalOrders = paidOrders.length;
  const averageTicket = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  // By payment method
  const byPaymentMethod: Record<string, number> = {};
  paidOrders.forEach(o => {
    const method = o.payment_method || 'cash';
    byPaymentMethod[method] = (byPaymentMethod[method] || 0) + o.total_amount;
  });

  // By item type (requires order_lines - simplified here)
  const byItemType: Record<string, number> = {
    product: totalSales, // Would need to join with order_lines to know actual split
    service: 0,
  };

  return {
    totalSales,
    totalOrders,
    averageTicket,
    byPaymentMethod,
    byItemType,
  };
};