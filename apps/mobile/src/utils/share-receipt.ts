/**
 * Share Receipt — Utility to share receipt as image/PDF.
 * 
 * Requires: react-native-view-shot
 * TODO: Install and implement
 */
import { Share } from 'react-native';
import type { Order } from '@saas-pos/domain';

export const shareReceipt = async (order: Order, receiptHtml: string): Promise<void> => {
  // Placeholder implementation
  // Will use react-native-view-shot to capture ReceiptView as image
  // Then Share API to share via WhatsApp, email, etc.
  
  try {
    // For now, fallback to native share
    const message = `
Recibo #${order.id.slice(0, 8)}
Total: S/ ${(order.total_amount / 100).toFixed(2)}
Método: ${order.payment_method || 'efectivo'}
    `.trim();

    await Share.share({
      message,
      title: `Recibo ${order.id.slice(0, 8)}`,
    });
  } catch (error) {
    console.error('Error sharing receipt:', error);
  }
};