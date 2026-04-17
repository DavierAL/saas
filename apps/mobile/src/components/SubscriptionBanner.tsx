/**
 * SubscriptionBanner — shows a warning strip when subscription is expiring soon.
 * Renders null when subscription is healthy (> 5 days remaining).
 * Renders a red block when expired (should redirect to paywall).
 */
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { getSubscriptionStatus } from '@saas-pos/domain';
import { useAuth } from '../providers/AppProvider';
import { useTenant } from '../hooks/useTenant';

export function SubscriptionBanner() {
  const { tenantId } = useAuth();
  const tenant = useTenant(tenantId ?? '');
  const router = useRouter();

  if (!tenant) return null;

  const status = getSubscriptionStatus(tenant);

  if (!status.isActive) {
    return (
      <Pressable style={s.expired} onPress={() => router.push('/paywall')}>
        <Text style={s.expiredText}>
          ⚠  Suscripción vencida — Toca para renovar
        </Text>
      </Pressable>
    );
  }

  if (status.isExpiringSoon) {
    return (
      <View style={s.warning}>
        <Text style={s.warningText}>
          ⚠  Suscripción vence en {status.daysRemaining} día{status.daysRemaining !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  }

  return null;
}

const s = StyleSheet.create({
  expired: {
    backgroundColor: '#2b0d0d',
    borderBottomWidth: 1,
    borderBottomColor: '#EF444430',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  expiredText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },

  warning: {
    backgroundColor: '#2b1e0d',
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  warningText: { fontSize: 12, color: '#F59E0B', fontWeight: '500' },
});
