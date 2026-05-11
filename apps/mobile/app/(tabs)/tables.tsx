/**
 * Tables Screen — Restaurant table management.
 *
 * Shows grid of tables with status colors.
 * Route: /(tabs)/tables
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePowerSyncQuery } from '@powersync/react-native';
import { colors, spacing, typography, radius } from '@saas-pos/ui';
import { useAuth } from '../../src/providers/AppProvider';
import { useModulesConfig } from '../../src/hooks/useModulesConfig';

const STATUS_COLORS = {
  free: colors.status.success,
  occupied: colors.accent.red,
  billing: colors.accent.amber,
};

const STATUS_LABELS = {
  free: 'Libre',
  occupied: 'Ocupada',
  billing: 'Cuenta',
};

const TABLE_STATUSES = ['free', 'occupied', 'billing'] as const;
type TableStatus = typeof TABLE_STATUSES[number];

interface TableRow {
  id: string;
  table_number: number;
  status: TableStatus;
}

export default function TablesScreen() {
  const { tenantId } = useAuth();
  const modules = useModulesConfig(tenantId);
  const tables = usePowerSyncQuery<TableRow>(
    `SELECT id, table_number, status FROM tables_restaurant WHERE tenant_id = ?`,
    [tenantId ?? ''],
  ) as TableRow[];
  
  if (!modules.has_tables) {
    return (
      <>
        <Stack.Screen options={{ title: 'Mesas' }} />
        <View style={s.empty}>
          <Ionicons name="restaurant-outline" size={64} color={colors.text.muted} />
          <Text style={s.emptyTitle}>Módulo no disponible</Text>
          <Text style={s.emptyDesc}>
            contacta al administrador para activar el módulo de mesas.
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Mesas' }} />
      <ScrollView style={s.container}>
        <Text style={s.header}>Selecciona una mesa</Text>
        
        <View style={s.grid}>
          {(tables ?? []).map((table) => (
            <Pressable
              key={table.id}
              style={[s.tableCard, { borderColor: STATUS_COLORS[table.status] }]}
            >
              <Text style={s.tableNumber}>{table.table_number}</Text>
              <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[table.status] + '20' }]}>
                <Text style={[s.statusText, { color: STATUS_COLORS[table.status] }]}>
                  {STATUS_LABELS[table.status]}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
        
        <View style={s.legend}>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: colors.status.success }]} />
            <Text style={s.legendText}>Libre</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: colors.accent.red }]} />
            <Text style={s.legendText}>Ocupada</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: colors.accent.amber }]} />
            <Text style={s.legendText}>Por pagar</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base, padding: spacing[4] },
  header: { fontSize: 18, fontWeight: typography.weight.semibold, color: colors.text.primary, marginBottom: spacing[4] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  tableCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[3],
  },
  tableNumber: { fontSize: 28, fontWeight: typography.weight.bold, color: colors.text.primary },
  statusBadge: { marginTop: spacing[2], paddingHorizontal: spacing[2], paddingVertical: 4, borderRadius: radius.sm },
  statusText: { fontSize: 10, fontWeight: typography.weight.bold, textTransform: 'uppercase' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: spacing[4], marginTop: spacing[6] },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: colors.text.muted },
  empty: { flex: 1, backgroundColor: colors.bg.base, alignItems: 'center', justifyContent: 'center', padding: spacing[8] },
  emptyTitle: { fontSize: 18, fontWeight: typography.weight.bold, color: colors.text.primary, marginTop: spacing[4] },
  emptyDesc: { fontSize: 14, color: colors.text.muted, textAlign: 'center', marginTop: spacing[2] },
});