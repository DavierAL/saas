/**
 * Catalog Tab — Browse items, add to cart.
 *
 * [UX-016] Three distinct states: Loading (skeleton), Empty, Error+retry
 * [UX-017] Sticky SearchBar with real-time filtering by name
 * [UX-018] Category tabs: Todos / Productos / Servicios
 */
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius } from '@saas-pos/ui';
import { FlashList } from '@shopify/flash-list';
const AnyFlashList = FlashList as any;
import { Stack } from 'expo-router';
import { useState, useMemo } from 'react';
import { useAuth } from '../../src/providers/AppProvider';
import { useItems } from '../../src/hooks/useItems';
import { useSyncStatus } from '../../src/hooks/useSyncStatus';
import { useCartStore } from '../../src/store/cart.store';
import { formatMoney, createMoney } from '@saas-pos/domain';
import type { Item } from '@saas-pos/domain';
import { Ionicons } from '@expo/vector-icons';

// ─── types ────────────────────────────────────────────────────────────────────
type Category = 'all' | 'product' | 'service';

// ─── sub-components ───────────────────────────────────────────────────────────

function SyncBadge() {
  const { status } = useSyncStatus();
  const color = { 
    connected: colors.accent.green, 
    connecting: colors.accent.amber, 
    disconnected: colors.text.muted, 
    error: colors.status.error 
  }[status];
  const label = { connected: 'Sync', connecting: '...', disconnected: 'Offline', error: 'Error' }[status];
  return (
    <View style={[st.syncBadge, { borderColor: (color ?? colors.text.muted) + '40' }]}>
      <View style={[st.syncDot, { backgroundColor: color ?? colors.text.muted }]} />
      <Text style={[st.syncLabel, { color: color ?? colors.text.muted }]}>{label}</Text>
    </View>
  );
}

/** [UX-016] Skeleton loader — 7 placeholder rows while data loads */
function SkeletonRow() {
  return (
    <View style={st.skeletonRow}>
      <View style={st.skeletonPill} />
      <View style={st.skeletonInfo}>
        <View style={st.skeletonLine} />
        <View style={[st.skeletonLine, { width: '40%', marginTop: spacing[1.5] }]} />
      </View>
      <View style={st.skeletonPrice} />
    </View>
  );
}

function SkeletonList() {
  return (
    <View>
      {[...Array(7)].map((_, i) => <SkeletonRow key={i} />)}
    </View>
  );
}

/** [UX-016] Empty state — distinct per context */
function EmptyState({
  isSearch, category,
}: { isSearch: boolean; category: Category }) {
  if (isSearch) {
    return (
      <View style={st.emptyWrap}>
        <Ionicons name="search-outline" size={52} color="#333" />
        <Text style={st.emptyTitle}>Sin resultados</Text>
        <Text style={st.emptyText}>Intenta con otro nombre</Text>
      </View>
    );
  }
  const icon   = category === 'service' ? 'briefcase-outline' : 'cube-outline';
  const label  = category === 'service' ? 'servicios' : 'productos';
  return (
    <View style={st.emptyWrap}>
      <Ionicons name={icon} size={52} color="#333" />
      <Text style={st.emptyTitle}>Sin {label}</Text>
      <Text style={st.emptyText}>
        {category === 'all'
          ? 'Agrega tu primer producto desde el panel web'
          : `No tienes ${label} en el catálogo aún`}
      </Text>
    </View>
  );
}

/** Category tab pill */
function CategoryTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[st.catTab, active && st.catTabActive]} onPress={onPress}>
      <Text style={[st.catTabText, active && st.catTabTextActive]}>{label}</Text>
    </Pressable>
  );
}

/** Product / service row */
function ItemRow({ item, onAdd }: { item: Item; onAdd: (item: Item) => void }) {
  const isProduct = item.type === 'product';
  const outOfStock = isProduct && item.stock !== null && item.stock === 0;
  const lowStock = isProduct && item.stock !== null && item.stock > 0 && item.stock <= 3;

  return (
    <Pressable
      style={({ pressed }) => [st.row, pressed && st.rowPressed, outOfStock && st.rowDisabled]}
      onPress={() => !outOfStock && onAdd(item)}
      disabled={outOfStock}
    >
      {/* Type badge */}
      <View style={[st.typePill, { backgroundColor: isProduct ? '#0d2b1e' : '#14143b' }]}>
        <Text style={[st.typeText, { color: isProduct ? '#3ECF8E' : '#818CF8' }]}>
          {isProduct ? 'P' : 'S'}
        </Text>
      </View>

      {/* Info */}
      <View style={st.rowInfo}>
        <Text style={[st.rowName, outOfStock && { color: '#555' }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.stock !== null && (
          <Text style={[st.rowStock, lowStock && { color: '#F59E0B' }, outOfStock && { color: '#EF4444' }]}>
            {outOfStock ? '⊗ Sin stock' : lowStock ? `⚠ Stock bajo: ${item.stock}` : `Stock: ${item.stock}`}
          </Text>
        )}
      </View>

      {/* Price + CTA */}
      <View style={st.rowRight}>
        <Text style={[st.rowPrice, outOfStock && { color: '#555' }]}>
          {formatMoney(createMoney(item.price, 'PEN'))}
        </Text>
        {!outOfStock && <Text style={st.addHint}>+ Agregar</Text>}
      </View>
    </Pressable>
  );
}

// ─── main screen ──────────────────────────────────────────────────────────────

export default function CatalogScreen() {
  const insets = useSafeAreaInsets();
  const { tenantId, subscriptionWarning } = useAuth();
  const { status, hasSynced } = useSyncStatus();

  const rawItems = useItems(tenantId ?? '');
  const addItem  = useCartStore((s) => s.addItem);

  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState<Category>('all');

  // [UX-016] Show skeleton ONLY on the first-ever sync (local DB empty, never completed a sync).
  // Once hasSynced=true OR items exist locally, skip straight to the list (even if still syncing).
  const isLoading = !hasSynced && rawItems.length === 0 && status !== 'disconnected';
  const isError   = status === 'error';

  // [UX-018] Category filter
  const byCategory = useMemo(() => {
    if (category === 'all') return rawItems;
    return rawItems.filter((i) => i.type === category);
  }, [rawItems, category]);

  // [UX-017] Search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return byCategory;
    const q = search.toLowerCase();
    return byCategory.filter((i) => i.name.toLowerCase().includes(q));
  }, [byCategory, search]);

  const handleAdd = (item: Item) => {
    addItem({ item_id: item.id, name: item.name, unit_price: item.price });
  };

  const productCount = rawItems.filter((i) => i.type === 'product').length;
  const serviceCount = rawItems.filter((i) => i.type === 'service').length;

  return (
    <>
      <Stack.Screen options={{ title: 'Catálogo', headerRight: () => <SyncBadge /> }} />
      <View style={[st.container, { paddingTop: Math.max(insets.top + spacing[6], spacing[10]) }]}>
        {/* Subscription Warning Banner */}
        {subscriptionWarning && (
          <View style={st.warningBanner}>
            <Ionicons name="warning-outline" size={18} color="#F59E0B" />
            <Text style={st.warningText}>{subscriptionWarning}</Text>
          </View>
        )}

        {/* Search Bar */}
        <View style={st.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            style={st.searchInput}
            placeholder="Buscar productos o servicios..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable hitSlop={12} onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        {/* [UX-018] Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.catRow} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
          <CategoryTab label={`Todos (${rawItems.length})`}       active={category === 'all'}     onPress={() => setCategory('all')} />
          <CategoryTab label={`Productos (${productCount})`}      active={category === 'product'} onPress={() => setCategory('product')} />
          <CategoryTab label={`Servicios (${serviceCount})`}      active={category === 'service'} onPress={() => setCategory('service')} />
        </ScrollView>

        {/* [UX-016] Three distinct states */}
        {isLoading ? (
          <ScrollView>
            <SkeletonList />
          </ScrollView>
        ) : isError ? (
          <View style={st.emptyWrap}>
            <Ionicons name="cloud-offline-outline" size={52} color="#EF4444" />
            <Text style={st.emptyTitle}>Error de conexión</Text>
            <Text style={st.emptyText}>No se pudo sincronizar el catálogo</Text>
            <Pressable style={st.retryBtn}>
              <Text style={st.retryBtnText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <AnyFlashList
            data={filtered}
            keyExtractor={(i: any) => i.id}
            estimatedItemSize={68}
            renderItem={({ item }: any) => <ItemRow item={item} onAdd={handleAdd} />}
            ItemSeparatorComponent={() => <View style={st.sep} />}
            ListEmptyComponent={
              <EmptyState isSearch={search.trim().length > 0} category={category} />
            }
          />
        )}
      </View>
    </>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.bg.base },

  // Sync badge
  syncBadge:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing[2], paddingVertical: 3, marginRight: spacing[2] },
  syncDot:         { width: 5, height: 5, borderRadius: 3, marginRight: 4 },
  syncLabel:       { fontSize: 10, fontWeight: typography.weight.semibold, letterSpacing: typography.tracking.wide },

  // Search
  searchBar:       { flexDirection: 'row', alignItems: 'center', margin: spacing[3], marginBottom: spacing[2], backgroundColor: colors.bg.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.default, paddingHorizontal: spacing[3], height: 40 },
  searchInput:     { flex: 1, color: colors.text.primary, fontSize: 14 },

  // Category tabs
  catRow:          { flexGrow: 0, paddingBottom: spacing[2.5] },
  catTab:          { paddingHorizontal: spacing[3], paddingVertical: spacing[1.5], borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.bg.surface },
  catTabActive:    { backgroundColor: colors.accent.greenDim, borderColor: colors.accent.green },
  catTabText:      { fontSize: 13, color: colors.text.muted, fontWeight: typography.weight.semibold },
  catTabTextActive: { color: colors.accent.green },

  // Skeleton
  skeletonRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], gap: spacing[3] },
  skeletonPill:    { width: 24, height: 24, borderRadius: radius.sm, backgroundColor: colors.bg.surface },
  skeletonInfo:    { flex: 1 },
  skeletonLine:    { height: 12, borderRadius: radius.sm, backgroundColor: colors.bg.surface, width: '70%' },
  skeletonPrice:   { width: 55, height: 16, borderRadius: radius.sm, backgroundColor: colors.bg.surface },

  // Row
  row:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  rowPressed:      { backgroundColor: colors.bg.surface },
  rowDisabled:     { opacity: 0.5 },
  typePill:        { width: 24, height: 24, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginRight: spacing[3] },
  typeText:        { fontSize: 10, fontWeight: typography.weight.extrabold },
  rowInfo:         { flex: 1 },
  rowName:         { fontSize: 14, color: colors.text.primary, fontWeight: typography.weight.medium },
  rowStock:        { fontSize: 11, color: colors.text.muted, marginTop: 2 },
  rowRight:        { alignItems: 'flex-end' },
  rowPrice:        { fontSize: 15, fontWeight: typography.weight.bold, color: colors.accent.green, letterSpacing: typography.tracking.tight },
  addHint:         { fontSize: 10, color: colors.accent.green + '88', marginTop: 2, fontWeight: typography.weight.medium },

  sep:             { height: 1, backgroundColor: colors.border.subtle },

  // Empty / error
  emptyWrap:       { alignItems: 'center', paddingTop: spacing[16], paddingHorizontal: spacing[10] },
  emptyTitle:      { fontSize: 16, color: colors.text.secondary, fontWeight: typography.weight.semibold, marginTop: spacing[4], marginBottom: spacing[2] },
  emptyText:       { fontSize: 13, color: colors.text.muted, textAlign: 'center', lineHeight: 19 },
  retryBtn:        { marginTop: spacing[5], backgroundColor: colors.bg.surface, borderRadius: radius.md, paddingVertical: spacing[2.5], paddingHorizontal: spacing[8], borderWidth: 1, borderColor: colors.status.error },
  retryBtnText:    { color: colors.status.error, fontWeight: typography.weight.bold, fontSize: 14 },

  warningBanner: {
    backgroundColor: colors.accent.amberDim,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2.5],
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent.amber + '40',
    gap: spacing[2.5],
  },
  warningText: {
    color: colors.accent.amber,
    fontSize: 12,
    fontWeight: typography.weight.semibold,
    flex: 1,
  },
});
