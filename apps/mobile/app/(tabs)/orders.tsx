/**
 * Orders Tab — Sales history with filters, search, and infinite scroll.
 *
 * [UX-012] Tap any row → OrderDetailScreen
 * [UX-013] Infinite scroll — loads 20 at a time via onEndReached
 * [UX-014] Date filter chips (Hoy / Semana / Mes) + text search by order ID
 * [UX-015] Timezone-safe "today" using locale-aware Date comparison
 */
import {
  View, Text, StyleSheet, Pressable,
  TextInput, ActivityIndicator,
} from 'react-native';
import { FlashList, type FlashListProps, type ListRenderItem } from '@shopify/flash-list';
import { Stack, router } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import { colors, spacing, typography, radius, Badge } from '@saas-pos/ui';
import { useAuth } from '../../src/providers/AppProvider';
import { useOrders } from '../../src/hooks/useOrders';
import { formatMoney, createMoney } from '@saas-pos/domain';
import type { Order } from '@saas-pos/domain';
import { Ionicons } from '@expo/vector-icons';
import { Skeleton } from '../../src/components/Skeleton';

// ─── helpers ──────────────────────────────────────────────────────────────────

type DateFilter = 'all' | 'today' | 'week' | 'month';

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  paid:               { label: 'Pagado',    variant: 'success' },
  pending:            { label: 'Pendiente', variant: 'warning' },
  cancelled:          { label: 'Cancelado', variant: 'error' },
  refunded:           { label: 'Reembolsado',variant: 'info' },
  partially_refunded: { label: 'Reem. Parcial',variant: 'info' },
  voided:             { label: 'Anulado',   variant: 'neutral' },
};

/** [UX-015] Returns start-of-day as a Date, using the device's locale timezone */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isToday(d: Date): boolean {
  const start = startOfDay(new Date());
  const target = startOfDay(d);
  return target.getTime() === start.getTime();
}

function isThisWeek(d: Date): boolean {
  const now = new Date();
  const startWeek = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()));
  return startOfDay(d).getTime() >= startWeek.getTime();
}

function isThisMonth(d: Date): boolean {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// ─── sub-components ───────────────────────────────────────────────────────────

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[s.chip, active && s.chipActive]}
      onPress={onPress}
    >
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function OrderRow({ order, onPress }: { order: Order; onPress: () => void }) {
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.cancelled;
  const date = new Date(order.created_at);
  const timeStr = date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  const dateStr = isToday(date)
    ? `Hoy · ${timeStr}`
    : date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) + ` · ${timeStr}`;

  return (
    <Pressable style={({ pressed }) => [s.row, pressed && s.rowPressed]} onPress={onPress}>
      <View style={s.rowLeft}>
        <Text style={s.rowId} numberOfLines={1}>#{order.id.split('-')[0]!.toUpperCase()}</Text>
        <Text style={s.rowDate}>{dateStr}</Text>
      </View>
      <View style={{ marginHorizontal: spacing[2] }}>
        <Badge label={cfg.label} variant={cfg.variant} dim={true} />
      </View>
      <View style={s.rowRight}>
        <Text style={s.rowTotal}>{formatMoney(createMoney(order.total_amount, order.currency))}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.text.muted} />
      </View>
    </Pressable>
  );
}

function OrderSkeleton() {
  return (
    <View style={s.row}>
      <View style={s.rowLeft}>
        <Skeleton width={80} height={16} style={{ marginBottom: 4 }} />
        <Skeleton width={120} height={12} />
      </View>
      <View style={{ marginHorizontal: spacing[2] }}>
        <Skeleton width={60} height={20} borderRadius={10} />
      </View>
      <View style={s.rowRight}>
        <Skeleton width={70} height={18} />
      </View>
    </View>
  );
}

// ─── main screen ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function OrdersScreen() {
  const { tenantId } = useAuth();
  const { orders: allOrders, loadMore, hasMore, isLoading } = useOrders(tenantId ?? '', PAGE_SIZE);

  const [search,     setSearch]     = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [loadingMore, setLoadingMore] = useState(false);

  // ── filter + search pipeline ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = allOrders;

    if (dateFilter !== 'all') {
      list = list.filter((o) => {
        const d = new Date(o.created_at);
        if (dateFilter === 'today') return isToday(d);
        if (dateFilter === 'week')  return isThisWeek(d);
        if (dateFilter === 'month') return isThisMonth(d);
        return true;
      });
    }

    if (search.trim()) {
      const q = search.trim().toUpperCase();
      list = list.filter((o) => o.id.toUpperCase().startsWith(q));
    }

    return list;
  }, [allOrders, dateFilter, search]);

  const displayed = filtered;

  const todayPaid = useMemo(
    () => allOrders.filter((o) => o.status === 'paid' && isToday(new Date(o.created_at))),
    [allOrders],
  );
  const todayTotal = useMemo(() => todayPaid.reduce((s, o) => s + o.total_amount, 0), [todayPaid]);

  const handleEndReached = useCallback(() => {
    // Avoid loading more if searching or already loading or no more items
    if (!hasMore || loadingMore || search.trim() || isLoading) return;
    
    setLoadingMore(true);
    // Add small delay for smoothness to show the spinner
    setTimeout(() => {
      loadMore();
      setLoadingMore(false);
    }, 300);
  }, [hasMore, loadingMore, search, loadMore, isLoading]);

  const handleFilterChange = (f: DateFilter) => {
    setDateFilter(f);
    // Pagination reset is handled by the hook resetting limit if tenant/params change,
    // but here we might want to stay on PAGE_SIZE if we change filters.
    // However, since we are doing local filtering on a reactive list, 
    // real cursor-based server filtering would be different.
    // For now, we keep the simplicity of reactive PowerSync.
  };

  return (
    <>
      <Stack.Screen options={{
        title: 'Órdenes',
        headerShown: true,
        headerStyle: { backgroundColor: colors.bg.base },
        headerTintColor: colors.text.primary,
      }} />

      <View style={s.container}>
        {/* Today Stats Bar */}
        <View style={s.todayBar}>
          <View style={s.todayStat}>
            <Text style={s.todayValue}>{todayPaid.length}</Text>
            <Text style={s.todayLabel}>Ventas hoy</Text>
          </View>
          <View style={s.todayDivider} />
          <View style={s.todayStat}>
            <Text style={[s.todayValue, { color: colors.status.success }]}>{formatMoney(createMoney(todayTotal, 'PEN'))}</Text>
            <Text style={s.todayLabel}>Total hoy</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={s.searchBar}>
          <Ionicons name="search" size={16} color={colors.text.muted} style={{ marginRight: spacing[2] }} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar por # de orden..."
            placeholderTextColor={colors.text.muted}
            value={search}
            onChangeText={(t) => { setSearch(t); }}
            returnKeyType="search"
            autoCapitalize="characters"
          />
          {search.length > 0 && (
            <Pressable hitSlop={8} onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.text.muted} />
            </Pressable>
          )}
        </View>

        {/* Date Filter Chips */}
        <View style={s.chips}>
          {([
            ['all',   'Todas'],
            ['today', 'Hoy'],
            ['week',  'Semana'],
            ['month', 'Mes'],
          ] as [DateFilter, string][]).map(([value, label]) => (
            <FilterChip
              key={value}
              label={label}
              active={dateFilter === value}
              onPress={() => handleFilterChange(value)}
            />
          ))}
        </View>

        {/* Count hint */}
        <Text style={s.countHint}>
          {displayed.length === 0
            ? 'Sin resultados'
            : `${displayed.length} órdenes cargadas ${search ? 'filtradas' : ''}`}
        </Text>

        {/* List */}
        {isLoading && displayed.length === 0 ? (
          <View style={{ flex: 1 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <React.Fragment key={i}>
                <OrderSkeleton />
                <View style={s.sep} />
              </React.Fragment>
            ))}
          </View>
        ) : (
          <FlashList
            data={displayed}
            keyExtractor={(o) => o.id}
            estimatedItemSize={84}
            renderItem={({ item }) => (
              <OrderRow
                order={item}
                onPress={() => router.push({ pathname: '/order-detail', params: { orderId: item.id } })}
              />
            )}
            ItemSeparatorComponent={() => <View style={s.sep} />}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <View style={s.loadingFooter}>
                  <ActivityIndicator color={colors.status.success} size="small" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={s.empty}>
                <View style={s.emptyIconContainer}>
                  <Ionicons name="receipt-outline" size={48} color={colors.bg.surface} />
                </View>
                <Text style={s.emptyTitle}>Sin órdenes</Text>
                <Text style={s.emptyText}>
                  {search ? 'No se encontraron órdenes con ese ID' : 'Las ventas aparecerán aquí una vez que realices el primer cobro'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.bg.base },

  // Stats bar
  todayBar:      { flexDirection: 'row', backgroundColor: colors.bg.surface, borderBottomWidth: 1, borderBottomColor: colors.border.default, paddingVertical: spacing[4] },
  todayStat:     { flex: 1, alignItems: 'center' },
  todayValue:    { fontSize: 20, fontWeight: typography.weight.bold, color: colors.text.primary, letterSpacing: typography.tracking.tight },
  todayLabel:    { fontSize: 10, color: colors.text.muted, marginTop: 2, fontWeight: typography.weight.medium, letterSpacing: typography.tracking.wide, textTransform: 'uppercase' },
  todayDivider:  { width: 1, backgroundColor: colors.border.default, marginVertical: 4 },

  // Search
  searchBar:    { flexDirection: 'row', alignItems: 'center', margin: spacing[3], marginBottom: spacing[2], backgroundColor: colors.bg.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.default, paddingHorizontal: spacing[3], height: 44 },
  searchInput:  { flex: 1, color: colors.text.primary, fontSize: 14, height: '100%' },

  // Filter chips
  chips:        { flexDirection: 'row', paddingHorizontal: spacing[3], gap: spacing[2], marginBottom: spacing[2] },
  chip:         { paddingHorizontal: spacing[3], paddingVertical: spacing[1.5], borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.bg.surface },
  chipActive:   { backgroundColor: colors.accent.greenDim, borderColor: colors.accent.green },
  chipText:     { fontSize: 12, color: colors.text.muted, fontWeight: typography.weight.semibold },
  chipTextActive: { color: colors.accent.green },

  // Count hint
  countHint:    { fontSize: 11, color: colors.text.muted, paddingHorizontal: spacing[4], paddingBottom: spacing[2], paddingTop: spacing[0.5] },

  // Row
  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
  rowPressed:   { backgroundColor: colors.bg.elevated },
  rowLeft:      { flex: 1 },
  rowId:        { fontSize: 13, color: colors.text.primary, fontWeight: typography.weight.semibold },
  rowDate:      { fontSize: 11, color: colors.text.muted, marginTop: 4 },
  rowRight:     { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  rowTotal:     { fontSize: 15, fontWeight: typography.weight.bold, color: colors.text.primary, letterSpacing: typography.tracking.tight, minWidth: 72, textAlign: 'right' },

  sep:          { height: 1, backgroundColor: colors.bg.surface },
  loadingFooter: { paddingVertical: 20, alignItems: 'center' },

  // Empty
  empty:        { alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing[8] },
  emptyIconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.bg.surface, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[4] },
  emptyTitle:   { fontSize: 18, color: colors.text.primary, fontWeight: typography.weight.bold, marginBottom: spacing[2] },
  emptyText:    { fontSize: 14, color: colors.text.muted, textAlign: 'center', lineHeight: 20 },
});
