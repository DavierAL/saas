/**
 * Cash Closing Screen — Daily sales summary.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, Button } from '@saas-pos/ui';
import { formatMoney, createMoney } from '@saas-pos/domain';
import { generateCashClosing } from '@saas-pos/application';
import type { Order } from '@saas-pos/domain';
import { useOrders } from '../src/hooks/useOrders';
import { useAuth } from '../src/providers/AppProvider';

export default function CashClosingScreen() {
  const { tenantId } = useAuth();
  const { orders } = useOrders(tenantId ?? '', 100);
  const today = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return { start, end };
  }, []);

  const summary = useMemo(() => 
    generateCashClosing(orders as Order[], today.start, today.end),
    [orders, today]
  );

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'yape': return 'Yape';
      case 'plin': return 'Plin';
      case 'transfer': return 'Transferencia';
      default: return method;
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Cierre de Caja',
          headerStyle: { backgroundColor: colors.bg.base },
          headerTintColor: colors.text.primary,
        }} 
      />
      <ScrollView style={s.container}>
        <View style={s.header}>
          <Text style={s.dateTitle}>Cierre del día</Text>
          <Text style={s.dateSubtitle}>
            {today.start.toLocaleDateString('es-PE', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </Text>
        </View>

        {/* Main Stats */}
        <View style={s.statsCard}>
          <View style={s.statRow}>
            <Text style={s.statLabel}>Total vendido</Text>
            <Text style={s.statValueLarge}>
              {formatMoney(createMoney(summary.totalSales, 'PEN'))}
            </Text>
          </View>
          
          <View style={s.statDivider} />
          
          <View style={s.statRowInline}>
            <View style={s.statBlock}>
              <Text style={s.statValue}>{summary.totalOrders}</Text>
              <Text style={s.statLabelSmall}>Órdenes</Text>
            </View>
            <View style={s.statBlock}>
              <Text style={s.statValue}>{formatMoney(createMoney(summary.averageTicket, 'PEN'))}</Text>
              <Text style={s.statLabelSmall}>Ticket prom.</Text>
            </View>
          </View>
        </View>

        {/* By Payment Method */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Por método de pago</Text>
          {Object.entries(summary.byPaymentMethod).map(([method, amount]) => (
            <View key={method} style={s.row}>
              <Text style={s.rowLabel}>{formatPaymentMethod(method)}</Text>
              <Text style={s.rowValue}>{formatMoney(createMoney(amount, 'PEN'))}</Text>
            </View>
          ))}
          {Object.keys(summary.byPaymentMethod).length === 0 && (
            <Text style={s.emptyText}>Sin ventas registradas</Text>
          )}
        </View>

        {/* By Item Type */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Por tipo de item</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Productos</Text>
            <Text style={s.rowValue}>
              {formatMoney(createMoney(summary.byItemType.product, 'PEN'))}
            </Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Servicios</Text>
            <Text style={s.rowValue}>
              {formatMoney(createMoney(summary.byItemType.service, 'PEN'))}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <Button
            label="Compartir resumen"
            variant="outline"
            onPress={() => {}}
            icon="share-social-outline"
          />
        </View>
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  header: { padding: spacing[4], paddingTop: spacing[6], backgroundColor: colors.bg.surface },
  dateTitle: { fontSize: 24, fontWeight: typography.weight.bold, color: colors.text.primary },
  dateSubtitle: { fontSize: 14, color: colors.text.muted, marginTop: spacing[1] },
  statsCard: { margin: spacing[4], padding: spacing[4], backgroundColor: colors.bg.surface, borderRadius: radius.lg },
  statRow: { alignItems: 'center', marginBottom: spacing[3] },
  statLabel: { fontSize: 14, color: colors.text.muted, marginBottom: spacing[1] },
  statValueLarge: { fontSize: 32, fontWeight: typography.weight.bold, color: colors.accent.green },
  statDivider: { height: 1, backgroundColor: colors.border.default, marginVertical: spacing[3] },
  statRowInline: { flexDirection: 'row', justifyContent: 'space-around' },
  statBlock: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: typography.weight.bold, color: colors.text.primary },
  statLabelSmall: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
  section: { margin: spacing[4], marginTop: spacing[2] },
  sectionTitle: { fontSize: 16, fontWeight: typography.weight.semibold, color: colors.text.primary, marginBottom: spacing[3] },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  rowLabel: { fontSize: 14, color: colors.text.secondary },
  rowValue: { fontSize: 14, fontWeight: typography.weight.medium, color: colors.text.primary },
  emptyText: { fontSize: 14, color: colors.text.muted, fontStyle: 'italic' },
  actions: { padding: spacing[4], paddingBottom: spacing[8] },
});