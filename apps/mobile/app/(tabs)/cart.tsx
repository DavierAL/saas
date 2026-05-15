/**
 * Cart Tab — Review cart and trigger checkout
 */
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, spacing, typography, radius, Button } from '@saas-pos/ui';
import { useCartStore } from '../../src/store/cart.store';
import { useCheckout } from '../../src/hooks/useCheckout';
import { formatMoney, createMoney } from '@saas-pos/domain';
import { Ionicons } from '@expo/vector-icons';
import { PaymentMethodSelector } from '../../src/components/PaymentMethodSelector';
import { triggerHaptic } from '../../src/components/HapticFeedback';
import { useToast } from '../../src/providers/ToastProvider';
import type { PaymentMethod } from '@saas-pos/domain';
import { useAuth } from '../../src/providers/AppProvider';
import { useTenant } from '../../src/hooks/useTenant';

function CartItemRow({ item_id, name, unit_price, quantity, currency, onQuantityChange }: {
  item_id: string; name: string; unit_price: number; quantity: number; currency: string;
  onQuantityChange: (item_id: string, name: string, newQty: number, currentQty: number) => void;
}) {
  const subtotal = createMoney(unit_price * quantity, currency);

  const handleManualQuantity = () => {
    Alert.prompt(
      'Cantidad',
      `Ingresa la cantidad para ${name}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'OK', 
          onPress: (val?: string) => {
            const num = parseInt(val || '0', 10);
            if (!isNaN(num) && num !== quantity) {
              onQuantityChange(item_id, name, num, quantity);
            }
          }
        },
      ],
      'plain-text',
      quantity.toString(),
      'number-pad'
    );
  };

  return (
    <View style={s.cartRow}>
      <View style={s.cartInfo}>
        <Text style={s.cartName} numberOfLines={1}>{name}</Text>
        <Text style={s.cartUnitPrice}>{formatMoney(createMoney(unit_price, currency))} c/u</Text>
      </View>
      <View style={s.cartQty}>
        <Pressable 
          style={s.qtyBtn} 
          onPress={() => onQuantityChange(item_id, name, quantity - 1, quantity)}
          hitSlop={8}
        >
          <Ionicons name="remove" size={16} color={colors.text.primary} />
        </Pressable>
        <Pressable onLongPress={handleManualQuantity} delayLongPress={500}>
          <Text style={s.qtyValue}>{quantity}</Text>
        </Pressable>
        <Pressable 
          style={s.qtyBtn} 
          onPress={() => onQuantityChange(item_id, name, quantity + 1, quantity)}
          hitSlop={8}
        >
          <Ionicons name="add" size={16} color={colors.text.primary} />
        </Pressable>
      </View>
      <Text style={s.cartSubtotal}>{formatMoney(subtotal)}</Text>
    </View>
  );
}

export default function CartScreen() {
  const { tenantId } = useAuth();
  const { tenant } = useTenant(tenantId);
  const setCurrency = useCartStore((s) => s.setCurrency);
  const toast = useToast();

  const items = useCartStore((st) => st.items);
  const currency = tenant?.currency || 'PEN';
  const total = useCartStore((st) => st.total());
  const clearCart = useCartStore((st) => st.clearCart);
  const updateQuantity = useCartStore((st) => st.updateQuantity);
  const removeItem = useCartStore((st) => st.removeItem);
  const customerName = useCartStore((st) => st.customerName);
  const setCustomerName = useCartStore((st) => st.setCustomerName);
  const paymentMethod = useCartStore((st) => st.paymentMethod);
  const setPaymentMethod = useCartStore((st) => st.setPaymentMethod);
  const { state, error, processCheckout, reset } = useCheckout();

  const handleCheckout = async () => {
    if (total <= 0) {
      toast.showWarning('Agrega productos al carrito antes de cobrar');
      return;
    }
    const result = await processCheckout();
    if (result === 'success') {
      triggerHaptic('success');
      Alert.alert('✓ Venta registrada', 'La orden fue guardada exitosamente.', [
        { text: 'Ir a órdenes', onPress: () => { reset(); router.replace('/(tabs)/orders'); } },
        { text: 'Nueva venta', onPress: () => { reset(); router.replace('/(tabs)'); } },
      ]);
    } else if (result === 'error') {
      triggerHaptic('error');
      toast.showError(error ?? 'Error al procesar la venta');
    }
  };

  const confirmClear = () => {
    Alert.alert(
      '¿Vaciar carrito?',
      'Esta acción eliminará todos los productos del carrito actual.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Vaciar', style: 'destructive', onPress: () => {
          clearCart();
          triggerHaptic('warning');
          toast.showInfo('Carrito vaciado');
        }},
      ]
    );
  };

  const handleQuantityChange = (item_id: string, name: string, newQty: number, currentQty: number) => {
    if (newQty === 0 && currentQty > 0) {
      Alert.alert(
        `¿Eliminar "${name}"?`,
        'El producto será eliminado del carrito.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => {
            removeItem(item_id);
            triggerHaptic('warning');
            toast.showInfo(`${name} eliminado`);
          }},
        ]
      );
    } else {
      updateQuantity(item_id, newQty);
      triggerHaptic('selection');
    }
  };

  return (
    <>
      <Stack.Screen options={{
        title: 'Carrito',
        headerShown: true,
        headerStyle: { backgroundColor: colors.bg.base },
        headerTintColor: colors.text.primary
      }} />
      <View style={s.container}>
        {items.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIconContainer}>
              <Ionicons name="cart-outline" size={64} color={colors.text.muted} />
            </View>
            <Text style={s.emptyTitle}>Carrito vacío</Text>
            <Text style={s.emptyDesc}>Agrega productos o servicios desde el catálogo para comenzar un nuevo cobro.</Text>
            <Button
              label="Ir al catálogo"
              variant="outline"
              onPress={() => router.replace('/(tabs)')}
              style={{ marginTop: spacing[6] }}
            />
          </View>
        ) : (
          <>
            <ScrollView style={s.list}>
              {items.map((item) => (
                <CartItemRow key={item.item_id} {...item} currency={currency} onQuantityChange={handleQuantityChange} />
              ))}
            </ScrollView>

            <View style={s.footer}>
              {error && (
                <View style={s.errorBox}>
                  <Text style={s.errorText}>{error}</Text>
                </View>
              )}
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Total</Text>
                <Text style={s.totalValue}>{formatMoney(createMoney(total, currency))}</Text>
              </View>

              <View style={s.customerSection}>
                <Text style={s.customerLabel}>Cliente (opcional)</Text>
                <TextInput
                  style={s.customerInput}
                  placeholder="Ej: Juan Perez"
                  placeholderTextColor={colors.text.muted}
                  value={customerName}
                  onChangeText={setCustomerName}
                />
              </View>

              <PaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
              />

              <Button
                label={`Cobrar · ${formatMoney(createMoney(total, currency))}`}
                onPress={handleCheckout}
                loading={state === 'processing'}
                variant="primary"
                size="lg"
              />

              <Pressable onPress={confirmClear} style={s.clearBtn}>
                <Text style={s.clearBtnText}>Vaciar carrito</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </>
  );
}

const s = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.bg.base },
  list:               { flex: 1 },
  cartRow:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.bg.surface },
  cartInfo:           { flex: 1 },
  cartName:           { fontSize: 14, color: colors.text.primary, fontWeight: typography.weight.medium },
  cartUnitPrice:      { fontSize: 11, color: colors.text.muted, marginTop: 2 },
  cartQty:            { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing[3] },
  qtyBtn:             { width: 28, height: 28, backgroundColor: colors.bg.surface, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText:         { fontSize: 16, color: colors.text.primary, fontWeight: typography.weight.semibold },
  qtyValue:           { fontSize: 15, color: colors.text.primary, fontWeight: typography.weight.bold, marginHorizontal: spacing[2.5], minWidth: 24, textAlign: 'center' },
  cartSubtotal:       { fontSize: 14, fontWeight: typography.weight.bold, color: colors.accent.green, minWidth: 70, textAlign: 'right' },
  footer:             { borderTopWidth: 1, borderTopColor: colors.border.default, padding: spacing[4], backgroundColor: colors.bg.base },
  errorBox:           { backgroundColor: colors.accent.redDim, borderRadius: radius.md, padding: spacing[3], marginBottom: spacing[3] },
  errorText:          { color: colors.accent.red, fontSize: 13 },
  totalRow:           { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[4] },
  totalLabel:         { fontSize: 15, color: colors.text.secondary, fontWeight: typography.weight.medium },
  totalValue:         { fontSize: 22, color: colors.text.primary, fontWeight: typography.weight.bold, letterSpacing: typography.tracking.tight },
  clearBtn:           { alignItems: 'center', paddingVertical: spacing[2.5] },
  clearBtnText:       { fontSize: 13, color: colors.text.muted },
  empty:              { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[8] },
  emptyIconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.bg.surface, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[6] },
  emptyTitle:         { fontSize: 20, color: colors.text.primary, fontWeight: typography.weight.bold, marginBottom: spacing[2] },
  emptyDesc:          { fontSize: 14, color: colors.text.muted, textAlign: 'center', lineHeight: 20 },
  customerSection:    { marginBottom: spacing[4] },
  customerLabel:      { fontSize: 13, color: colors.text.secondary, fontWeight: typography.weight.medium, marginBottom: spacing[2] },
  customerInput:      { 
    backgroundColor: colors.bg.surface, 
    borderRadius: radius.md, 
    paddingHorizontal: spacing[4], 
    paddingVertical: spacing[3],
    fontSize: 14,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
});
