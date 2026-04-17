import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useCartStore } from '../../src/store/cart.store';
import { SubscriptionBanner } from '../../src/components/SubscriptionBanner';

function TabIcon({ symbol, color, badge }: { symbol: string; color: string; badge?: number }) {
  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.icon, { color }]}>{symbol}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
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
            backgroundColor: '#0f0f0f',
            borderTopColor: '#1e1e1e',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: '#3ECF8E',
          tabBarInactiveTintColor: '#555',
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0.3,
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

const styles = StyleSheet.create({
  iconContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center', width: 32, height: 28 },
  icon:          { fontSize: 18 },
  badge: {
    position: 'absolute', top: -2, right: -6,
    backgroundColor: '#3ECF8E', borderRadius: 9999,
    minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#0f0f0f' },
});
