/**
 * Catalog Tab
 * FlashList of all items with tap-to-add to cart.
 * Design: Supabase dark + Linear precision
 */
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '../../src/providers/AppProvider';
import { useItems } from '../../src/hooks/useItems';
import { useSyncStatus } from '../../src/hooks/useSyncStatus';
import { useCartStore } from '../../src/store/cart.store';
import { formatMoney, createMoney } from '@saas-pos/domain';
import type { Item } from '@saas-pos/domain';

function SyncBadge() {
  const { status } = useSyncStatus();
  const color = { connected: '#3ECF8E', connecting: '#F59E0B', disconnected: '#555', error: '#EF4444' }[status];
  const label = { connected: 'Sync', connecting: '...', disconnected: 'Offline', error: 'Error' }[status];
  return (
    <View style={[styles.syncBadge, { borderColor: (color ?? '#555') + '40' }]}>
      <View style={[styles.syncDot, { backgroundColor: color ?? '#555' }]} />
      <Text style={[styles.syncLabel, { color: color ?? '#555' }]}>{label}</Text>
    </View>
  );
}

function ItemRow({ item, onAdd }: { item: Item; onAdd: (item: Item) => void }) {
  const isProduct = item.type === 'product';
  const price = createMoney(item.price);
  const outOfStock = item.type === 'product' && item.stock !== null && item.stock === 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed, outOfStock && styles.rowDisabled]}
      onPress={() => !outOfStock && onAdd(item)}
      disabled={outOfStock}
    >
      <View style={[styles.typePill, { backgroundColor: isProduct ? '#0d2b1e' : '#14143b' }]}>
        <Text style={[styles.typeText, { color: isProduct ? '#3ECF8E' : '#818CF8' }]}>
          {isProduct ? 'P' : 'S'}
        </Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, outOfStock && { color: '#555' }]} numberOfLines={1}>{item.name}</Text>
        {item.stock !== null && (
          <Text style={[styles.rowStock, item.stock <= 3 && { color: '#F59E0B' }]}>
            {outOfStock ? 'Sin stock' : `Stock: ${item.stock}`}
          </Text>
        )}
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowPrice, outOfStock && { color: '#555' }]}>{formatMoney(price)}</Text>
        {!outOfStock && <Text style={styles.addHint}>+ Agregar</Text>}
      </View>
    </Pressable>
  );
}

export default function CatalogScreen() {
  const { tenantId } = useAuth();
  const items = useItems(tenantId ?? '');
  const addItem = useCartStore((s) => s.addItem);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  const handleAdd = (item: Item) => {
    addItem({ item_id: item.id, name: item.name, unit_price: item.price });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Catálogo', headerRight: () => <SyncBadge /> }} />
      <View style={styles.container}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar producto..."
            placeholderTextColor="#555"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Text style={styles.searchClear}>✕</Text>
            </Pressable>
          )}
        </View>
        <FlashList
          data={filtered}
          keyExtractor={(i) => i.id}
          estimatedItemSize={68}
          renderItem={({ item }) => <ItemRow item={item} onAdd={handleAdd} />}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>{search ? '🔍' : '📦'}</Text>
              <Text style={styles.emptyText}>
                {search ? 'Sin resultados' : 'Catálogo vacío'}
              </Text>
            </View>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0f0f0f' },
  syncBadge:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 },
  syncDot:      { width: 5, height: 5, borderRadius: 3, marginRight: 4 },
  syncLabel:    { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  searchBar:    { flexDirection: 'row', alignItems: 'center', margin: 12, backgroundColor: '#1c1c1c', borderRadius: 8, borderWidth: 1, borderColor: '#272727', paddingHorizontal: 12 },
  searchIcon:   { fontSize: 16, color: '#555', marginRight: 8 },
  searchInput:  { flex: 1, height: 40, color: '#ededed', fontSize: 14 },
  searchClear:  { fontSize: 12, color: '#555', padding: 4 },
  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  rowPressed:   { backgroundColor: '#1a1a1a' },
  rowDisabled:  { opacity: 0.5 },
  typePill:     { width: 24, height: 24, borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  typeText:     { fontSize: 10, fontWeight: '800' },
  rowInfo:      { flex: 1 },
  rowName:      { fontSize: 14, color: '#ededed', fontWeight: '500' },
  rowStock:     { fontSize: 11, color: '#666', marginTop: 2 },
  rowRight:     { alignItems: 'flex-end' },
  rowPrice:     { fontSize: 15, fontWeight: '700', color: '#3ECF8E', letterSpacing: -0.3 },
  addHint:      { fontSize: 10, color: '#3ECF8E88', marginTop: 2, fontWeight: '500' },
  sep:          { height: 1, backgroundColor: '#181818' },
  empty:        { alignItems: 'center', paddingTop: 60 },
  emptyIcon:    { fontSize: 36, marginBottom: 12 },
  emptyText:    { fontSize: 14, color: '#555' },
});
