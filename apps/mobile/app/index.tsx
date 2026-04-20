import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
const AnyFlashList = FlashList as any;
import { Stack } from 'expo-router';
import { colors, spacing, typography, radius, Badge, StatusDot } from '@saas-pos/ui';
import { useAuth } from '../src/providers/AppProvider';
import { useItems } from '../src/hooks/useItems';
import { useSyncStatus } from '../src/hooks/useSyncStatus';
import { formatMoney, createMoney } from '@saas-pos/domain';
import type { Item } from '@saas-pos/domain';

// ─── Sync Badge ───────────────────────────────────────────────
function SyncBadge() {
  const { status, hasSynced } = useSyncStatus();

  const labels: Record<string, string> = {
    connected:    'Sincronizado',
    connecting:   'Conectando...',
    disconnected: 'Sin conexión',
    error:        'Error sync',
  };

  return (
    <View style={s.badgeContainer}>
      <StatusDot status={status === 'connected' ? 'online' : status === 'connecting' ? 'connecting' : 'error'} />
      <Text style={[s.badgeText, { color: status === 'connected' ? colors.status.success : colors.text.muted }]}>
        {labels[status]}
      </Text>
      {!hasSynced && status === 'connected' && (
        <ActivityIndicator size="small" color={colors.status.success} style={{ marginLeft: spacing[1.5] }} />
      )}
    </View>
  );
}

// ─── Item Card ────────────────────────────────────────────────
function ItemCard({ item }: { item: Item }) {
  const price = createMoney(item.price, 'PEN');
  const isProduct = item.type === 'product';

  return (
    <View style={s.itemCard}>
      <View style={s.itemLeft}>
        <Badge 
          label={isProduct ? 'PROD' : 'SERV'} 
          variant={isProduct ? 'success' : 'info'} 
          dim={true} 
        />
        <View style={s.itemNameContainer}>
          <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
          {item.stock !== null && (
            <Text style={s.itemStock}>Stock: {item.stock} unidades</Text>
          )}
        </View>
      </View>
      <Text style={s.itemPrice}>{formatMoney(price)}</Text>
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────
function EmptyState({ hasSynced }: { hasSynced: boolean }) {
  return (
    <View style={s.emptyState}>
      <Text style={s.emptyIcon}>{hasSynced ? '📦' : '⏳'}</Text>
      <Text style={s.emptyTitle}>
        {hasSynced ? 'Sin productos' : 'Sincronizando...'}
      </Text>
      <Text style={s.emptyDesc}>
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
      <View style={s.container}>
        {/* Stats bar */}
        <View style={s.statsBar}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{items.length}</Text>
            <Text style={s.statLabel}>Total</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: colors.status.success }]}>
              {products.length}
            </Text>
            <Text style={s.statLabel}>Productos</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: colors.accent.indigo }]}>
              {services.length}
            </Text>
            <Text style={s.statLabel}>Servicios</Text>
          </View>
        </View>

        {/* Catalog list — FlashList for 60fps */}
        <AnyFlashList
          data={items as any}
          keyExtractor={(item: any) => item.id}
          estimatedItemSize={72}
          renderItem={({ item }: any) => <ItemCard item={item} />}
          ListEmptyComponent={<EmptyState hasSynced={hasSynced} />}
          contentContainerStyle={s.listContent}
          ItemSeparatorComponent={() => <View style={s.separator} />}
        />
      </View>
    </>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },

  // Sync Badge
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    marginRight: spacing[2],
  },
  badgeText: {
    fontSize: 11,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.tracking.wide,
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    paddingVertical: spacing[4],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    letterSpacing: typography.tracking.tight,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
    fontWeight: typography.weight.medium,
    letterSpacing: typography.tracking.wide,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.default,
    marginVertical: 6,
  },

  // List
  listContent: {
    paddingVertical: spacing[2],
  },
  separator: {
    height: 1,
    backgroundColor: colors.bg.surface,
  },

  // Item Card
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing[3],
  },
  itemNameContainer: {
    flex: 1,
    marginLeft: spacing[3],
  },
  itemName: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: typography.weight.medium,
  },
  itemStock: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: typography.weight.bold,
    color: colors.accent.green,
    letterSpacing: typography.tracking.tight,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing[8],
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  emptyDesc: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
