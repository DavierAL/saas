import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius } from '@saas-pos/ui';
import { useCartStore } from '../../src/store/cart.store';
import { SubscriptionBanner } from '../../src/components/SubscriptionBanner';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import { useModulesConfig } from '../../src/hooks/useModulesConfig';

function TabIcon({ name, color, badge }: { name: any; color: string; badge?: number }) {
  return (
    <View style={s.iconContainer}>
      <Ionicons name={name} size={24} color={color} />
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
  const insets = useSafeAreaInsets();
  const modules = useModulesConfig();

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <SubscriptionBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.bg.base,
            borderTopColor: colors.border.subtle,
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingBottom: 8 + insets.bottom,
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
            tabBarIcon: ({ color }) => <TabIcon name="grid-outline" color={color} />,
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Carrito',
            tabBarIcon: ({ color }) => (
              <TabIcon name="cart-outline" color={color} badge={itemCount} />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Órdenes',
            tabBarIcon: ({ color }) => <TabIcon name="receipt-outline" color={color} />,
          }}
        />
        {modules.has_tables && (
          <Tabs.Screen
            name="tables"
            options={{
              title: 'Mesas',
              tabBarIcon: ({ color }) => <TabIcon name="restaurant-outline" color={color} />,
            }}
          />
        )}
        {modules.has_appointments && (
          <Tabs.Screen
            name="appointments"
            options={{
              title: 'Citas',
              tabBarIcon: ({ color }) => <TabIcon name="calendar-outline" color={color} />,
            }}
          />
        )}
      </Tabs>
    </View>
  );
}

const s = StyleSheet.create({
  iconContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center', width: 44, height: 44 },
  badge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: colors.accent.green, borderRadius: radius.full,
    minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    borderWidth: 2, borderColor: colors.bg.base,
  },
  badgeText: { fontSize: 12, fontWeight: typography.weight.bold, color: colors.bg.base },
});
