/**
 * Cart Tab — Review cart and trigger checkout
 */
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, spacing, typography, radius, Button } from '@saas-pos/ui';
import { useCartStore } from '../../src/store/cart.store';
import { useCheckout } from '../../src/hooks/useCheckout';
import { formatMoney, createMoney } from '@saas-pos/domain';

function CartItemRow({ item_id, name, unit_price, quantity }: {
  item_id: string; name: string; unit_price: number; quantity: number;
}) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const subtotal = createMoney(unit_price * quantity, 'PEN');

  return (
    <View style={s.cartRow}>
      <View style={s.cartInfo}>
        <Text style={s.cartName} numberOfLines={1}>{name}</Text>
        <Text style={s.cartUnitPrice}>{formatMoney(createMoney(unit_price, 'PEN'))} c/u</Text>
      </View>
      <View style={s.cartQty}>
        <Pressable style={s.qtyBtn} onPress={() => updateQuantity(item_id, Math.max(0, quantity - 1))}>
          <Text style={s.qtyBtnText}>−</Text>
        </Pressable>
        <Text style={s.qtyValue}>{quantity}</Text>
        <Pressable style={s.qtyBtn} onPress={() => updateQuantity(item_id, quantity + 1)}>
          <Text style={s.qtyBtnText}>+</Text>
        </Pressable>
      </View>
      <Text style={s.cartSubtotal}>{formatMoney(subtotal)}</Text>
    </View>
  );
}

export default function CartScreen() {
  const items = useCartStore((st) => st.items);
  const total = useCartStore((st) => st.total());
  const clearCart = useCartStore((st) => st.clearCart);
  const { state, error, processCheckout, reset } = useCheckout();

  const handleCheckout = async () => {
    await processCheckout();
    if (state === 'success') {
      Alert.alert('✓ Venta registrada', 'La orden fue guardada.', [
        { text: 'OK', onPress: () => { reset(); router.replace('/(tabs)/orders'); } },
      ]);
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
            <Text style={s.emptyIcon}>◈</Text>
            <Text style={s.emptyTitle}>Carrito vacío</Text>
            <Text style={s.emptyDesc}>Agrega productos desde el catálogo.</Text>
          </View>
        ) : (
          <>
            <ScrollView style={s.list}>
              {items.map((item) => (
                <CartItemRow key={item.item_id} {...item} />
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
                <Text style={s.totalValue}>{formatMoney(createMoney(total, 'PEN'))}</Text>
              </View>
              
              <Button
                label={`Cobrar · ${formatMoney(createMoney(total, 'PEN'))}`}
                onPress={handleCheckout}
                loading={state === 'processing'}
                variant="primary"
                size="lg"
              />

              <Pressable onPress={clearCart} style={s.clearBtn}>
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
  empty:              { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon:          { fontSize: 48, marginBottom: spacing[4], color: colors.bg.surface },
  emptyTitle:         { fontSize: 18, color: colors.text.primary, fontWeight: typography.weight.semibold, marginBottom: 6 },
  emptyDesc:          { fontSize: 14, color: colors.text.muted },
});
