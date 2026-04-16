/**
 * Home Screen — POS Hello World
 *
 * Design: Supabase-inspired dark theme + Linear precision
 *   bg: #0f0f0f  |  surface: #1c1c1c  |  accent: #3ECF8E
 *
 * Demonstrates:
 *   - Reactive query (useItems) reading from SQLite — offline-first
 *   - Live sync status badge (useSyncStatus)
 *   - FlashList for performant catalog rendering
 */
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Stack } from 'expo-router';
import { useAuth } from '../src/providers/AppProvider';
import { useItems } from '../src/hooks/useItems';
import { useSyncStatus } from '../src/hooks/useSyncStatus';
import { formatMoney, createMoney } from '@saas-pos/domain';
import type { Item } from '@saas-pos/domain';

// ─── Sync Badge ───────────────────────────────────────────────
function SyncBadge() {
  const { status, hasSynced } = useSyncStatus();

  const colors: Record<string, string> = {
    connected:    '#3ECF8E',
    connecting:   '#F59E0B',
    disconnected: '#9b9b9b',
    error:        '#EF4444',
  };
  const labels: Record<string, string> = {
    connected:    'Sincronizado',
    connecting:   'Conectando...',
    disconnected: 'Sin conexión',
    error:        'Error sync',
  };

  return (
    <View style={[styles.badge, { borderColor: colors[status] + '40' }]}>
      <View style={[styles.badgeDot, { backgroundColor: colors[status] }]} />
      <Text style={[styles.badgeText, { color: colors[status] }]}>
        {labels[status]}
      </Text>
      {\!hasSynced && status === 'connected' && (
        <ActivityIndicator size="small" color={colors[status]} style={{ marginLeft: 6 }} />
      )}
    </View>
  );
}

// ─── Item Card ────────────────────────────────────────────────
function ItemCard({ item }: { item: Item }) {
  const price = createMoney(item.price);
  const isProduct = item.type === 'product';

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemLeft}>
        <View style={[
          styles.itemTypePill,
          { backgroundColor: isProduct ? '#0d2b1e' : '#14143b' },
        ]}>
          <Text style={[
            styles.itemTypeText,
            { color: isProduct ? '#3ECF8E' : '#818CF8' },
          ]}>
            {isProduct ? 'PROD' : 'SERV'}
          </Text>
        </View>
        <View style={styles.itemNameContainer}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          {item.stock \!== null && (
            <Text style={styles.itemStock}>Stock: {item.stock} unidades</Text>
          )}
        </View>
      </View>
      <Text style={styles.itemPrice}>{formatMoney(price)}</Text>
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────
function EmptyState({ hasSynced }: { hasSynced: boolean }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{hasSynced ? '📦' : '⏳'}</Text>
      <Text style={styles.emptyTitle}>
        {hasSynced ? 'Sin productos' : 'Sincronizando...'}
      </Text>
      <Text style={styles.emptyDesc}>
        {hasSynced
          ? 'Agrega productos desde el dashboard web.'
          : 'Descargando catálogo desde la nube por primera vez.'}
      </Text>
    </View>
  );
}

// ─── Home Screen ──────────────────────────────────────────────
export default function HomeScreen() {
  const { tenantId } = useAuth();
  const items = useItems(tenantId ?? '');
  const { hasSynced } = useSyncStatus();

  const products = items.filter((i) => i.type === 'product');
  const services = items.filter((i) => i.type === 'service');

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Catálogo',
          headerRight: () => <SyncBadge />,
        }}
      />
      <View style={styles.container}>
        {/* Stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{items.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#3ECF8E' }]}>
              {products.length}
            </Text>
            <Text style={styles.statLabel}>Productos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#818CF8' }]}>
              {services.length}
            </Text>
            <Text style={styles.statLabel}>Servicios</Text>
          </View>
        </View>

        {/* Catalog list — FlashList for 60fps */}
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          estimatedItemSize={72}
          renderItem={({ item }) => <ItemCard item={item} />}
          ListEmptyComponent={<EmptyState hasSynced={hasSynced} />}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────
// Design system: Supabase dark + Linear precision
// Tokens: bg #0f0f0f | surface #1c1c1c | border #272727
//         accent #3ECF8E | text #ededed | muted #666
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },

  // Sync Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1c',
    borderBottomWidth: 1,
    borderBottomColor: '#272727',
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ededed',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#272727',
    marginVertical: 6,
  },

  // List
  listContent: {
    paddingVertical: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#181818',
  },

  // Item Card
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  itemTypePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 12,
  },
  itemTypeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  itemNameContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    color: '#ededed',
    fontWeight: '500',
  },
  itemStock: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3ECF8E',
    letterSpacing: -0.3,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ededed',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
