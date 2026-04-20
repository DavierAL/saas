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
import { colors, spacing, typography, radius, Badge } from '@saas-pos/ui';
import { useAuth } from '../src/providers/AppProvider';
import { useOrders } from '../src/hooks/useOrders';
import { useOrderLines } from '../src/hooks/useOrderLines';
import { formatMoney, createMoney } from '@saas-pos/domain';
import { Ionicons } from '@expo/vector-icons';

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  paid:               { label: 'Pagado',    variant: 'success' },
  pending:            { label: 'Pendiente', variant: 'warning' },
  cancelled:          { label: 'Cancelado', variant: 'error' },
  refunded:           { label: 'Reembolsado',variant: 'info' },
  partially_refunded: { label: 'Reem. Parcial',variant: 'info' },
  voided:             { label: 'Anulado',   variant: 'neutral' },
};

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
        <Stack.Screen options={{ 
          title: 'Detalle', 
          headerShown: true, 
          headerStyle: { backgroundColor: colors.bg.base }, 
          headerTintColor: colors.text.primary 
        }} />
        <View style={s.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.text.muted} />
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
        headerStyle: { backgroundColor: colors.bg.base },
        headerTintColor: colors.text.primary,
      }} />

      <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: spacing[10] }}>
        {/* Order Header Card */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.orderId}>#{orderId8}</Text>
            <Badge label={cfg.label} variant={cfg.variant} dim={true} />
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
            <Text style={[s.totalLabel, { fontSize: 16, color: colors.text.primary, fontWeight: typography.weight.bold }]}>Total</Text>
            <Text style={s.grandTotal}>{formatMoney(createMoney(order.total_amount, order.currency))}</Text>
          </View>
        </View>

        {/* Actions */}
        <SectionHeader title="Acciones" />
        <View style={s.card}>
          <Pressable style={({ pressed }) => [s.actionBtn, pressed && { backgroundColor: colors.bg.elevated }]}>
            <Ionicons name="print-outline" size={18} color={colors.status.success} />
            <Text style={s.actionBtnText}>Reimprimir Recibo</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.text.muted} style={{ marginLeft: 'auto' }} />
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.bg.base },
  centered:       { flex: 1, backgroundColor: colors.bg.base, alignItems: 'center', justifyContent: 'center', gap: spacing[4] },
  notFoundText:   { fontSize: 16, color: colors.text.muted },
  backBtn:        { backgroundColor: colors.bg.surface, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 24, borderWidth: 1, borderColor: colors.border.default },
  backBtnText:    { color: colors.text.primary, fontSize: 14, fontWeight: typography.weight.semibold },

  card:           { backgroundColor: colors.bg.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.default, marginHorizontal: spacing[4], marginBottom: spacing[2], overflow: 'hidden' },
  cardRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[1] },
  orderId:        { fontSize: 20, fontWeight: typography.weight.bold, color: colors.text.primary, letterSpacing: typography.tracking.tight },
  dateText:       { fontSize: 13, color: colors.text.secondary, paddingHorizontal: spacing[4], paddingBottom: spacing[1] },
  fullId:         { fontSize: 10, color: colors.text.muted, paddingHorizontal: spacing[4], paddingBottom: spacing[4], fontVariant: ['tabular-nums'] },

  sectionHeader:  { fontSize: 11, fontWeight: typography.weight.semibold, color: colors.text.muted, letterSpacing: typography.tracking.wider, textTransform: 'uppercase', paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[2] },

  lineRow:        { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  lineLeft:       { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  lineQty:        { fontSize: 13, color: colors.text.secondary, fontWeight: typography.weight.semibold, minWidth: 28 },
  lineName:       { fontSize: 13, color: colors.text.primary, flex: 1 },
  lineRight:      { alignItems: 'flex-end' },
  lineUnit:       { fontSize: 11, color: colors.text.muted },
  lineSubtotal:   { fontSize: 14, fontWeight: typography.weight.bold, color: colors.text.primary, marginTop: 2 },
  lineSep:        { height: 1, backgroundColor: colors.bg.base, marginHorizontal: spacing[4] },
  emptyLines:     { paddingVertical: 24, alignItems: 'center' },
  emptyLinesText: { fontSize: 13, color: colors.text.muted },

  totalRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  totalLabel:     { fontSize: 13, color: colors.text.secondary },
  totalValue:     { fontSize: 14, color: colors.text.primary, fontWeight: typography.weight.semibold },
  totalDivider:   { height: 1, backgroundColor: colors.border.default, marginHorizontal: spacing[4] },
  grandTotal:     { fontSize: 22, fontWeight: typography.weight.bold, color: colors.status.success, letterSpacing: typography.tracking.tight },

  actionBtn:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[4], gap: 12 },
  actionBtnText:  { fontSize: 14, color: colors.text.primary, fontWeight: typography.weight.medium },
});
