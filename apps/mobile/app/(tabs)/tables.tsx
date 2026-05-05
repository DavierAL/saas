/**
 * Tables Screen — Restaurant table management.
 * 
 * Shows grid of tables with status colors.
 * Route: /(tabs)/tables
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '@saas-pos/ui';
import { useAuth } from '../../src/providers/AppProvider';
import { useModulesConfig } from '../../src/hooks/useModulesConfig';

// Mock data - in production would use use case
const MOCK_TABLES = [
  { id: '1', table_number: 1, status: 'free' },
  { id: '2', table_number: 2, status: 'occupied' },
  { id: '3', table_number: 3, status: 'free' },
  { id: '4', table_number: 4, status: 'billing' },
  { id: '5', table_number: 5, status: 'free' },
  { id: '6', table_number: 6, status: 'free' },
];

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

export default function TablesScreen() {
  const { tenantId } = useAuth();
  const modules = useModulesConfig();
  
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
          {MOCK_TABLES.map((table) => (
            <Pressable
              key={table.id}
              style={[s.tableCard, { borderColor: STATUS_COLORS[table.status as keyof typeof STATUS_COLORS] }]}
            >
              <Text style={s.tableNumber}>{table.table_number}</Text>
              <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[table.status as keyof typeof STATUS_COLORS] + '20' }]}>
                <Text style={[s.statusText, { color: STATUS_COLORS[table.status as keyof typeof STATUS_COLORS] }]}>
                  {STATUS_LABELS[table.status as keyof typeof STATUS_LABELS]}
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