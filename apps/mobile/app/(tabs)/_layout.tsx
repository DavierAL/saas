import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '@saas-pos/ui';
import { useCartStore } from '../../src/store/cart.store';
import { SubscriptionBanner } from '../../src/components/SubscriptionBanner';

function TabIcon({ symbol, color, badge }: { symbol: string; color: string; badge?: number }) {
  return (
    <View style={s.iconContainer}>
      <Text style={[s.icon, { color }]}>{symbol}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const itemCount = useCartStore((s) => s.itemCount());

  return (
    <View style={{ flex: 1 }}>
      <SubscriptionBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.bg.base,
            borderTopColor: colors.border.subtle,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: colors.accent.green,
          tabBarInactiveTintColor: colors.text.muted,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: typography.weight.semibold,
            letterSpacing: typography.tracking.wide,
            textTransform: 'uppercase',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Catálogo',
            tabBarIcon: ({ color }) => <TabIcon symbol="⊞" color={color} />,
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Carrito',
            tabBarIcon: ({ color }) => (
              <TabIcon symbol="◈" color={color} badge={itemCount} />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Órdenes',
            tabBarIcon: ({ color }) => <TabIcon symbol="◉" color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const s = StyleSheet.create({
  iconContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center', width: 32, height: 28 },
  icon:          { fontSize: 18 },
  badge: {
    position: 'absolute', top: -2, right: -6,
    backgroundColor: colors.accent.green, borderRadius: radius.full,
    minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: typography.weight.bold, color: colors.bg.base },
});
