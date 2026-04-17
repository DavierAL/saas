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
  const color = { connected: '#3ECF8E', connecting: '#F59E0B', disconnected: '#555', error: '#EF4444' }[status];
  const label = { connected: 'Sync', connecting: '...', disconnected: 'Offline', error: 'Error' }[status];
  return (
    <View style={[st.syncBadge, { borderColor: (color ?? '#555') + '40' }]}>
      <View style={[st.syncDot, { backgroundColor: color ?? '#555' }]} />
      <Text style={[st.syncLabel, { color: color ?? '#555' }]}>{label}</Text>
    </View>
  );
}

/** [UX-016] Skeleton loader — 6 placeholder rows while data loads */
function SkeletonRow() {
  return (
    <View style={st.skeletonRow}>
      <View style={st.skeletonPill} />
      <View style={st.skeletonInfo}>
        <View style={st.skeletonLine} />
        <View style={[st.skeletonLine, { width: '40%', marginTop: 6 }]} />
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
  const { tenantId } = useAuth();
  const { status } = useSyncStatus();

  const rawItems = useItems(tenantId ?? '');
  const addItem  = useCartStore((s) => s.addItem);

  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState<Category>('all');

  // Determine loading state: syncing with empty local DB
  const isLoading = status === 'connecting' && rawItems.length === 0;
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
      <View style={st.container}>

        {/* Search Bar */}
        <View style={st.searchBar}>
          <Ionicons name="search" size={16} color="#555" style={{ marginRight: 8 }} />
          <TextInput
            style={st.searchInput}
            placeholder="Buscar producto o servicio..."
            placeholderTextColor="#555"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable hitSlop={8} onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#555" />
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
  container:       { flex: 1, backgroundColor: '#0f0f0f' },

  // Sync badge
  syncBadge:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 },
  syncDot:         { width: 5, height: 5, borderRadius: 3, marginRight: 4 },
  syncLabel:       { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },

  // Search
  searchBar:       { flexDirection: 'row', alignItems: 'center', margin: 12, marginBottom: 8, backgroundColor: '#1c1c1c', borderRadius: 8, borderWidth: 1, borderColor: '#272727', paddingHorizontal: 12, height: 40 },
  searchInput:     { flex: 1, color: '#ededed', fontSize: 14 },

  // Category tabs
  catRow:          { flexGrow: 0, paddingBottom: 10 },
  catTab:          { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#272727', backgroundColor: '#1c1c1c' },
  catTabActive:    { backgroundColor: '#0d2b1e', borderColor: '#3ECF8E' },
  catTabText:      { fontSize: 13, color: '#666', fontWeight: '600' },
  catTabTextActive: { color: '#3ECF8E' },

  // Skeleton
  skeletonRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  skeletonPill:    { width: 24, height: 24, borderRadius: 5, backgroundColor: '#1e1e1e' },
  skeletonInfo:    { flex: 1 },
  skeletonLine:    { height: 12, borderRadius: 4, backgroundColor: '#1e1e1e', width: '70%' },
  skeletonPrice:   { width: 55, height: 16, borderRadius: 4, backgroundColor: '#1e1e1e' },

  // Row
  row:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  rowPressed:      { backgroundColor: '#1a1a1a' },
  rowDisabled:     { opacity: 0.5 },
  typePill:        { width: 24, height: 24, borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  typeText:        { fontSize: 10, fontWeight: '800' },
  rowInfo:         { flex: 1 },
  rowName:         { fontSize: 14, color: '#ededed', fontWeight: '500' },
  rowStock:        { fontSize: 11, color: '#666', marginTop: 2 },
  rowRight:        { alignItems: 'flex-end' },
  rowPrice:        { fontSize: 15, fontWeight: '700', color: '#3ECF8E', letterSpacing: -0.3 },
  addHint:         { fontSize: 10, color: '#3ECF8E88', marginTop: 2, fontWeight: '500' },

  sep:             { height: 1, backgroundColor: '#181818' },

  // Empty / error
  emptyWrap:       { alignItems: 'center', paddingTop: 64, paddingHorizontal: 40 },
  emptyTitle:      { fontSize: 16, color: '#444', fontWeight: '600', marginTop: 18, marginBottom: 8 },
  emptyText:       { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 19 },
  retryBtn:        { marginTop: 20, backgroundColor: '#1c1c1c', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 28, borderWidth: 1, borderColor: '#EF4444' },
  retryBtnText:    { color: '#EF4444', fontWeight: '700', fontSize: 14 },
});
