/**
 * Cart Tab — Review cart and trigger checkout
 */
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { useCartStore } from '../../src/store/cart.store';
import { useCheckout } from '../../src/hooks/useCheckout';
import { formatMoney, createMoney } from '@saas-pos/domain';

function CartItemRow({ item_id, name, unit_price, quantity }: {
  item_id: string; name: string; unit_price: number; quantity: number;
}) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = createMoney(unit_price * quantity);

  return (
    <View style={s.cartRow}>
      <View style={s.cartInfo}>
        <Text style={s.cartName} numberOfLines={1}>{name}</Text>
        <Text style={s.cartUnitPrice}>{formatMoney(createMoney(unit_price))} c/u</Text>
      </View>
      <View style={s.cartQty}>
        <Pressable style={s.qtyBtn} onPress={() => updateQuantity(item_id, quantity - 1)}>
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
      <Stack.Screen options={{ title: 'Carrito', headerShown: true,
        headerStyle: { backgroundColor: '#0f0f0f' }, headerTintColor: '#ededed' }} />
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
                <Text style={s.totalValue}>{formatMoney(createMoney(total))}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [s.checkoutBtn, pressed && s.checkoutBtnPressed, state === 'processing' && s.checkoutBtnDisabled]}
                onPress={handleCheckout}
                disabled={state === 'processing'}
              >
                {state === 'processing' ? (
                  <ActivityIndicator color="#0f0f0f" />
                ) : (
                  <Text style={s.checkoutBtnText}>Cobrar · {formatMoney(createMoney(total))}</Text>
                )}
              </Pressable>
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
  container:          { flex: 1, backgroundColor: '#0f0f0f' },
  list:               { flex: 1 },
  cartRow:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#181818' },
  cartInfo:           { flex: 1 },
  cartName:           { fontSize: 14, color: '#ededed', fontWeight: '500' },
  cartUnitPrice:      { fontSize: 11, color: '#666', marginTop: 2 },
  cartQty:            { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 },
  qtyBtn:             { width: 28, height: 28, backgroundColor: '#252525', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText:         { fontSize: 16, color: '#ededed', fontWeight: '600' },
  qtyValue:           { fontSize: 15, color: '#ededed', fontWeight: '700', marginHorizontal: 10, minWidth: 24, textAlign: 'center' },
  cartSubtotal:       { fontSize: 14, fontWeight: '700', color: '#3ECF8E', minWidth: 70, textAlign: 'right' },
  footer:             { borderTopWidth: 1, borderTopColor: '#272727', padding: 16, backgroundColor: '#0f0f0f' },
  errorBox:           { backgroundColor: '#2b0d0d', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText:          { color: '#EF4444', fontSize: 13 },
  totalRow:           { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  totalLabel:         { fontSize: 15, color: '#9b9b9b', fontWeight: '500' },
  totalValue:         { fontSize: 22, color: '#ededed', fontWeight: '700', letterSpacing: -0.5 },
  checkoutBtn:        { backgroundColor: '#3ECF8E', borderRadius: 8, height: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  checkoutBtnPressed: { backgroundColor: '#2EBF7E' },
  checkoutBtnDisabled:{ opacity: 0.7 },
  checkoutBtnText:    { fontSize: 16, fontWeight: '700', color: '#0f0f0f', letterSpacing: -0.2 },
  clearBtn:           { alignItems: 'center', paddingVertical: 10 },
  clearBtnText:       { fontSize: 13, color: '#555' },
  empty:              { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon:          { fontSize: 48, marginBottom: 16, color: '#333' },
  emptyTitle:         { fontSize: 18, color: '#ededed', fontWeight: '600', marginBottom: 6 },
  emptyDesc:          { fontSize: 14, color: '#555' },
});
