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
import { FlashList } from '@shopify/flash-list';
const AnyFlashList = FlashList as any;
import { Stack, router } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../src/providers/AppProvider';
import { useOrders } from '../../src/hooks/useOrders';
import { formatMoney, createMoney } from '@saas-pos/domain';
import type { Order } from '@saas-pos/domain';
import { Ionicons } from '@expo/vector-icons';

// ─── helpers ──────────────────────────────────────────────────────────────────

type DateFilter = 'all' | 'today' | 'week' | 'month';

const STATUS_CONFIG = {
  paid:               { label: 'Pagado',    color: '#3ECF8E', bg: '#0d2b1e' },
  pending:            { label: 'Pendiente', color: '#F59E0B', bg: '#2b1e0d' },
  cancelled:          { label: 'Cancelado', color: '#EF4444', bg: '#2b0d0d' },
  refunded:           { label: 'Reembolsado',color: '#818CF8', bg: '#14143b' },
  partially_refunded: { label: 'Reem. Parcial',color: '#818CF8', bg: '#14143b' },
  voided:             { label: 'Anulado',   color: '#9b9b9b', bg: '#1c1c1c' },
} as const;

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
      <View style={[s.statusPill, { backgroundColor: cfg.bg }]}>
        <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
      <View style={s.rowRight}>
        <Text style={s.rowTotal}>{formatMoney(createMoney(order.total_amount, order.currency))}</Text>
        <Ionicons name="chevron-forward" size={14} color="#555" />
      </View>
    </Pressable>
  );
}

// ─── main screen ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function OrdersScreen() {
  const { tenantId } = useAuth();

  // [UX-013] We load a large buffer from PowerSync (already indexed/local),
  // and paginate the *display* list client-side with sliceEnd.
  const allOrders = useOrders(tenantId ?? '', 500);

  const [search,     setSearch]     = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sliceEnd,   setSliceEnd]   = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  // ── filter + search pipeline ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = allOrders;

    // Date filter
    if (dateFilter !== 'all') {
      list = list.filter((o) => {
        const d = new Date(o.created_at);
        if (dateFilter === 'today') return isToday(d);
        if (dateFilter === 'week')  return isThisWeek(d);
        if (dateFilter === 'month') return isThisMonth(d);
        return true;
      });
    }

    // Text search by order ID prefix
    if (search.trim()) {
      const q = search.trim().toUpperCase();
      list = list.filter((o) => o.id.toUpperCase().startsWith(q));
    }

    return list;
  }, [allOrders, dateFilter, search]);

  const displayed = useMemo(() => filtered.slice(0, sliceEnd), [filtered, sliceEnd]);

  // ── today stats (paid only, timezone-safe) ─────────────────────────────────
  const todayPaid = useMemo(
    () => allOrders.filter((o) => o.status === 'paid' && isToday(new Date(o.created_at))),
    [allOrders],
  );
  const todayTotal = useMemo(() => todayPaid.reduce((s, o) => s + o.total_amount, 0), [todayPaid]);

  // ── infinite scroll handler ────────────────────────────────────────────────
  const handleEndReached = useCallback(() => {
    if (sliceEnd >= filtered.length) return;
    setLoadingMore(true);
    // Small timeout to let RN render the current frame first
    setTimeout(() => {
      setSliceEnd((prev) => Math.min(prev + PAGE_SIZE, filtered.length));
      setLoadingMore(false);
    }, 150);
  }, [sliceEnd, filtered.length]);

  const handleFilterChange = (f: DateFilter) => {
    setDateFilter(f);
    setSliceEnd(PAGE_SIZE); // Reset pagination when filter changes
  };

  return (
    <>
      <Stack.Screen options={{
        title: 'Órdenes',
        headerShown: true,
        headerStyle: { backgroundColor: '#0f0f0f' },
        headerTintColor: '#ededed',
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
            <Text style={[s.todayValue, { color: '#3ECF8E' }]}>{formatMoney(createMoney(todayTotal, 'PEN'))}</Text>
            <Text style={s.todayLabel}>Total hoy</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={s.searchBar}>
          <Ionicons name="search" size={16} color="#555" style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar por # de orden..."
            placeholderTextColor="#555"
            value={search}
            onChangeText={(t) => { setSearch(t); setSliceEnd(PAGE_SIZE); }}
            returnKeyType="search"
            autoCapitalize="characters"
          />
          {search.length > 0 && (
            <Pressable hitSlop={8} onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#555" />
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
          {filtered.length === 0
            ? 'Sin resultados'
            : `${Math.min(sliceEnd, filtered.length)} de ${filtered.length} órdenes`}
        </Text>

        {/* List */}
        <AnyFlashList
          data={displayed as any}
          keyExtractor={(o: any) => o.id}
          estimatedItemSize={84}
          renderItem={({ item }: any) => (
            <OrderRow
              order={item}
              onPress={() => router.push({ pathname: '/order-detail', params: { orderId: item.id } })}
            />
          )}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={s.loadingFooter}>
                <ActivityIndicator color="#3ECF8E" size="small" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="receipt-outline" size={48} color="#333" />
              <Text style={s.emptyTitle}>Sin órdenes</Text>
              <Text style={s.emptyText}>
                {search ? 'No se encontraron órdenes con ese ID' : 'Las ventas aparecerán aquí'}
              </Text>
            </View>
          }
        />
      </View>
    </>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#0f0f0f' },

  // Stats bar
  todayBar:      { flexDirection: 'row', backgroundColor: '#1c1c1c', borderBottomWidth: 1, borderBottomColor: '#272727', paddingVertical: 14 },
  todayStat:     { flex: 1, alignItems: 'center' },
  todayValue:    { fontSize: 20, fontWeight: '700', color: '#ededed', letterSpacing: -0.5 },
  todayLabel:    { fontSize: 10, color: '#666', marginTop: 2, fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase' },
  todayDivider:  { width: 1, backgroundColor: '#272727', marginVertical: 4 },

  // Search
  searchBar:    { flexDirection: 'row', alignItems: 'center', margin: 12, marginBottom: 8, backgroundColor: '#1c1c1c', borderRadius: 8, borderWidth: 1, borderColor: '#272727', paddingHorizontal: 12, height: 40 },
  searchInput:  { flex: 1, color: '#ededed', fontSize: 14 },

  // Filter chips
  chips:        { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 4 },
  chip:         { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#272727', backgroundColor: '#1c1c1c' },
  chipActive:   { backgroundColor: '#0d2b1e', borderColor: '#3ECF8E' },
  chipText:     { fontSize: 12, color: '#666', fontWeight: '600' },
  chipTextActive: { color: '#3ECF8E' },

  // Count hint
  countHint:    { fontSize: 11, color: '#444', paddingHorizontal: 16, paddingBottom: 6, paddingTop: 2 },

  // Row
  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  rowPressed:   { backgroundColor: '#1a1a1a' },
  rowLeft:      { flex: 1 },
  rowId:        { fontSize: 13, color: '#ededed', fontWeight: '600', fontVariant: ['tabular-nums'] },
  rowDate:      { fontSize: 11, color: '#666', marginTop: 2 },
  statusPill:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginHorizontal: 10 },
  statusText:   { fontSize: 11, fontWeight: '600' },
  rowRight:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowTotal:     { fontSize: 15, fontWeight: '700', color: '#ededed', letterSpacing: -0.3, minWidth: 72, textAlign: 'right' },

  sep:          { height: 1, backgroundColor: '#181818' },
  loadingFooter: { paddingVertical: 20, alignItems: 'center' },

  // Empty
  empty:        { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle:   { fontSize: 16, color: '#444', fontWeight: '600', marginTop: 16, marginBottom: 6 },
  emptyText:    { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 18 },
});
