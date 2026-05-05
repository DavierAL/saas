/**
 * PaymentMethodSelector — Select payment method before checkout.
 * 
 * Options: cash, yape, plin, transfer
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '@saas-pos/ui';
import type { PaymentMethod } from '@saas-pos/domain';

interface PaymentMethodSelectorProps {
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
}

const PAYMENT_OPTIONS: { method: PaymentMethod; label: string; icon: string }[] = [
  { method: 'cash', label: 'Efectivo', icon: 'cash-outline' },
  { method: 'yape', label: 'Yape', icon: 'phone-portrait-outline' },
  { method: 'plin', label: 'Plin', icon: 'chatbubble-outline' },
  { method: 'transfer', label: 'Transferencia', icon: 'swap-horizontal-outline' },
];

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <View style={s.container}>
      <Text style={s.label}>Método de pago</Text>
      <View style={s.options}>
        {PAYMENT_OPTIONS.map((opt) => (
          <Pressable
            key={opt.method}
            style={[s.option, value === opt.method && s.optionSelected]}
            onPress={() => onChange(opt.method)}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === opt.method }}
          >
            <Ionicons 
              name={opt.icon as any} 
              size={20} 
              color={value === opt.method ? colors.accent.green : colors.text.muted} 
            />
            <Text style={[s.optionText, value === opt.method && s.optionTextSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
    marginBottom: spacing[2],
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2.5],
    paddingHorizontal: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.surface,
    gap: spacing[2],
  },
  optionSelected: {
    borderColor: colors.accent.green,
    backgroundColor: colors.accent.greenDim,
  },
  optionText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
  optionTextSelected: {
    color: colors.accent.green,
  },
});