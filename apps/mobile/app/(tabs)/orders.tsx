/**
 * Orders Tab — Recent sales history
 */
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Stack } from 'expo-router';
import { useAuth } from '../../src/providers/AppProvider';
import { useOrders } from '../../src/hooks/useOrders';
import { formatMoney, createMoney } from '@saas-pos/domain';
import type { Order } from '@saas-pos/domain';

const STATUS_CONFIG = {
  paid:      { label: 'Pagado',    color: '#3ECF8E', bg: '#0d2b1e' },
  pending:   { label: 'Pendiente', color: '#F59E0B', bg: '#2b1e0d' },
  cancelled: { label: 'Cancelado', color: '#EF4444', bg: '#2b0d0d' },
};

function OrderRow({ order }: { order: Order }) {
  const cfg = STATUS_CONFIG[order.status];
  const date = new Date(order.created_at);
  const timeStr = date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });

  return (
    <View style={s.row}>
      <View style={s.rowLeft}>
        <Text style={s.rowId} numberOfLines={1}>#{order.id.split('-')[0].toUpperCase()}</Text>
        <Text style={s.rowDate}>{dateStr} · {timeStr}</Text>
      </View>
      <View style={[s.statusPill, { backgroundColor: cfg.bg }]}>
        <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
      <Text style={s.rowTotal}>{formatMoney(createMoney(order.total_amount))}</Text>
    </View>
  );
}

export default function OrdersScreen() {
  const { tenantId } = useAuth();
  const orders = useOrders(tenantId ?? '');

  const todayTotal = orders
    .filter((o) => {
      const d = new Date(o.created_at);
      const now = new Date();
      return d.toDateString() === now.toDateString() && o.status === 'paid';
    })
    .reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <>
      <Stack.Screen options={{ title: 'Órdenes', headerShown: true,
        headerStyle: { backgroundColor: '#0f0f0f' }, headerTintColor: '#ededed' }} />
      <View style={s.container}>
        <View style={s.todayBar}>
          <View style={s.todayStat}>
            <Text style={s.todayValue}>{orders.filter(o => o.status === 'paid' && new Date(o.created_at).toDateString() === new Date().toDateString()).length}</Text>
            <Text style={s.todayLabel}>Ventas hoy</Text>
          </View>
          <View style={s.todayDivider} />
          <View style={s.todayStat}>
            <Text style={[s.todayValue, { color: '#3ECF8E' }]}>{formatMoney(createMoney(todayTotal))}</Text>
            <Text style={s.todayLabel}>Total hoy</Text>
          </View>
        </View>

        <FlashList
          data={orders}
          keyExtractor={(o) => o.id}
          estimatedItemSize={64}
          renderItem={({ item }) => <OrderRow order={item} />}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>◉</Text>
              <Text style={s.emptyText}>Sin órdenes aún</Text>
            </View>
          }
        />
      </View>
    </>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0f0f0f' },
  todayBar:     { flexDirection: 'row', backgroundColor: '#1c1c1c', borderBottomWidth: 1, borderBottomColor: '#272727', paddingVertical: 14 },
  todayStat:    { flex: 1, alignItems: 'center' },
  todayValue:   { fontSize: 20, fontWeight: '700', color: '#ededed', letterSpacing: -0.5 },
  todayLabel:   { fontSize: 10, color: '#666', marginTop: 2, fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase' },
  todayDivider: { width: 1, backgroundColor: '#272727', marginVertical: 4 },
  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  rowLeft:      { flex: 1 },
  rowId:        { fontSize: 13, color: '#ededed', fontWeight: '600', fontVariant: ['tabular-nums'] },
  rowDate:      { fontSize: 11, color: '#666', marginTop: 2 },
  statusPill:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginHorizontal: 10 },
  statusText:   { fontSize: 11, fontWeight: '600' },
  rowTotal:     { fontSize: 15, fontWeight: '700', color: '#ededed', letterSpacing: -0.3, minWidth: 80, textAlign: 'right' },
  sep:          { height: 1, backgroundColor: '#181818' },
  empty:        { alignItems: 'center', paddingTop: 60 },
  emptyIcon:    { fontSize: 36, color: '#333', marginBottom: 12 },
  emptyText:    { fontSize: 14, color: '#555' },
});
