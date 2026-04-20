import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { getSubscriptionStatus } from '@saas-pos/domain';
import { colors, spacing, typography } from '@saas-pos/ui';
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
      <Pressable style={[s.container, s.expired]} onPress={() => router.push('/paywall')}>
        <Text style={s.expiredText}>
          ⚠  Suscripción vencida — Toca para renovar
        </Text>
      </Pressable>
    );
  }

  if (status.isExpiringSoon) {
    return (
      <View style={[s.container, s.warning]}>
        <Text style={s.warningText}>
          ⚠  Suscripción vence en {status.daysRemaining} día{status.daysRemaining !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  }

  return null;
}

const s = StyleSheet.create({
  container: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  expired: {
    backgroundColor: colors.accent.redDim,
    borderBottomColor: `${colors.accent.red}30`,
  },
  expiredText: { 
    fontSize: typography.size.sm, 
    color: colors.accent.red, 
    fontWeight: typography.weight.bold 
  },
  warning: {
    backgroundColor: colors.accent.amberDim,
    borderBottomColor: `${colors.accent.amber}30`,
  },
  warningText: { 
    fontSize: typography.size.sm, 
    color: colors.accent.amber, 
    fontWeight: typography.weight.medium 
  },
});
