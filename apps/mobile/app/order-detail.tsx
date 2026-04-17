/**
 * OrderDetailScreen — [UX-012]
 *
 * Shows the full receipt for a single order:
 *   - Line items with quantity, unit price, subtotal
 *   - Order metadata (status, date, ID)
 *   - Total with large accent
 *   - "Print Receipt" placeholder action
 *
 * Route: /order-detail?orderId=xxx
 */
import {
  View, Text, StyleSheet, Pressable, ScrollView,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../src/providers/AppProvider';
import { useOrders } from '../src/hooks/useOrders';
import { useOrderLines } from '../src/hooks/useOrderLines';
import { formatMoney, createMoney } from '@saas-pos/domain';
import { Ionicons } from '@expo/vector-icons';

const STATUS_CONFIG = {
  paid:               { label: 'Pagado',    color: '#3ECF8E', bg: '#0d2b1e' },
  pending:            { label: 'Pendiente', color: '#F59E0B', bg: '#2b1e0d' },
  cancelled:          { label: 'Cancelado', color: '#EF4444', bg: '#2b0d0d' },
  refunded:           { label: 'Reembolsado',color: '#818CF8', bg: '#14143b' },
  partially_refunded: { label: 'Reem. Parcial',color: '#818CF8', bg: '#14143b' },
  voided:             { label: 'Anulado',   color: '#9b9b9b', bg: '#1c1c1c' },
} as const;

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { tenantId } = useAuth();

  const orders   = useOrders(tenantId ?? '', 500);
  const order    = orders.find((o) => o.id === orderId);
  const lines    = useOrderLines(orderId ?? '', tenantId ?? '');

  if (!order) {
    return (
      <>
        <Stack.Screen options={{ title: 'Detalle', headerShown: true, headerStyle: { backgroundColor: '#0f0f0f' }, headerTintColor: '#ededed' }} />
        <View style={s.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#555" />
          <Text style={s.notFoundText}>Orden no encontrada</Text>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backBtnText}>Volver</Text>
          </Pressable>
        </View>
      </>
    );
  }

  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.cancelled;
  const date = new Date(order.created_at);
  const dateStr = date.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  const orderId8 = order.id.split('-')[0]!.toUpperCase();

  return (
    <>
      <Stack.Screen options={{
        title: `Orden #${orderId8}`,
        headerShown: true,
        headerStyle: { backgroundColor: '#0f0f0f' },
        headerTintColor: '#ededed',
      }} />

      <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Order Header Card */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.orderId}>#{orderId8}</Text>
            <View style={[s.statusPill, { backgroundColor: cfg.bg }]}>
              <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
          <Text style={s.dateText}>{dateStr} · {timeStr}</Text>
          <Text style={s.fullId} numberOfLines={1}>ID: {order.id}</Text>
        </View>

        {/* Line Items */}
        <SectionHeader title="Productos" />
        <View style={s.card}>
          {lines.length === 0 ? (
            <View style={s.emptyLines}>
              <Text style={s.emptyLinesText}>Sin items registrados</Text>
            </View>
          ) : (
            lines.map((line, idx) => (
              <View key={line.id}>
                <View style={s.lineRow}>
                  <View style={s.lineLeft}>
                    <Text style={s.lineQty}>{line.quantity}x</Text>
                    <Text style={s.lineName} numberOfLines={2}>
                      {line.item_id.split('-')[0]!.toUpperCase()}
                    </Text>
                  </View>
                  <View style={s.lineRight}>
                    <Text style={s.lineUnit}>{formatMoney(createMoney(line.unit_price, order.currency))} c/u</Text>
                    <Text style={s.lineSubtotal}>{formatMoney(createMoney(line.subtotal, order.currency))}</Text>
                  </View>
                </View>
                {idx < lines.length - 1 && <View style={s.lineSep} />}
              </View>
            ))
          )}
        </View>

        {/* Totals */}
        <SectionHeader title="Resumen" />
        <View style={s.card}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal</Text>
            <Text style={s.totalValue}>{formatMoney(createMoney(order.total_amount, order.currency))}</Text>
          </View>
          <View style={s.totalDivider} />
          <View style={s.totalRow}>
            <Text style={[s.totalLabel, { fontSize: 16, color: '#ededed', fontWeight: '700' }]}>Total</Text>
            <Text style={s.grandTotal}>{formatMoney(createMoney(order.total_amount, order.currency))}</Text>
          </View>
        </View>

        {/* Actions */}
        <SectionHeader title="Acciones" />
        <View style={s.card}>
          <Pressable style={({ pressed }) => [s.actionBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="print-outline" size={18} color="#3ECF8E" />
            <Text style={s.actionBtnText}>Reimprimir Recibo</Text>
            <Ionicons name="chevron-forward" size={14} color="#555" style={{ marginLeft: 'auto' }} />
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0f0f0f' },
  centered:       { flex: 1, backgroundColor: '#0f0f0f', alignItems: 'center', justifyContent: 'center', gap: 16 },
  notFoundText:   { fontSize: 16, color: '#555' },
  backBtn:        { backgroundColor: '#1c1c1c', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24, borderWidth: 1, borderColor: '#272727' },
  backBtnText:    { color: '#ededed', fontSize: 14, fontWeight: '600' },

  card:           { backgroundColor: '#1c1c1c', borderRadius: 12, borderWidth: 1, borderColor: '#272727', marginHorizontal: 16, marginBottom: 8, overflow: 'hidden' },
  cardRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  orderId:        { fontSize: 20, fontWeight: '800', color: '#ededed', letterSpacing: -0.5 },
  statusPill:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText:     { fontSize: 12, fontWeight: '700' },
  dateText:       { fontSize: 13, color: '#9b9b9b', paddingHorizontal: 16, paddingBottom: 4 },
  fullId:         { fontSize: 10, color: '#3a3a3a', paddingHorizontal: 16, paddingBottom: 14, fontVariant: ['tabular-nums'] },

  sectionHeader:  { fontSize: 11, fontWeight: '600', color: '#555', letterSpacing: 0.6, textTransform: 'uppercase', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },

  lineRow:        { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 12 },
  lineLeft:       { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  lineQty:        { fontSize: 13, color: '#9b9b9b', fontWeight: '600', minWidth: 28 },
  lineName:       { fontSize: 13, color: '#ededed', flex: 1 },
  lineRight:      { alignItems: 'flex-end' },
  lineUnit:       { fontSize: 11, color: '#666' },
  lineSubtotal:   { fontSize: 14, fontWeight: '700', color: '#ededed', marginTop: 2 },
  lineSep:        { height: 1, backgroundColor: '#1e1e1e', marginHorizontal: 16 },
  emptyLines:     { paddingVertical: 24, alignItems: 'center' },
  emptyLinesText: { fontSize: 13, color: '#555' },

  totalRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  totalLabel:     { fontSize: 13, color: '#9b9b9b' },
  totalValue:     { fontSize: 14, color: '#ededed', fontWeight: '600' },
  totalDivider:   { height: 1, backgroundColor: '#272727', marginHorizontal: 16 },
  grandTotal:     { fontSize: 22, fontWeight: '800', color: '#3ECF8E', letterSpacing: -0.5 },

  actionBtn:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  actionBtnText:  { fontSize: 14, color: '#ededed', fontWeight: '500' },
});
