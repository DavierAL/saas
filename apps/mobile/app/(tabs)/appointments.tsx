/**
 * Appointments Screen — Barbería appointment calendar.
 *
 * Shows weekly calendar with appointments.
 * Route: /(tabs)/appointments
 */
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePowerSyncQuery } from '@powersync/react-native';
import { colors, spacing, typography, radius } from '@saas-pos/ui';
import { useAuth } from '../../src/providers/AppProvider';
import { useModulesConfig } from '../../src/hooks/useModulesConfig';

const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

type AppointmentStatus = 'scheduled' | 'done' | 'cancelled';

interface AppointmentRow {
  id: string;
  customer_name: string;
  start_time: string;
  status: AppointmentStatus;
  item_id: string;
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Programada',
  done: 'Completada',
  cancelled: 'Cancelada',
};

export default function AppointmentsScreen() {
  const { tenantId } = useAuth();
  const modules = useModulesConfig(tenantId);
  const [today] = useState(() => new Date());

  const appointments = usePowerSyncQuery<AppointmentRow>(
    `SELECT a.id, a.customer_name, a.start_time, a.status, a.item_id
     FROM appointments a
     WHERE a.tenant_id = ? AND date(a.start_time) = date(?)
     ORDER BY a.start_time ASC`,
    [tenantId ?? '', today.toISOString().split('T')[0]!],
  ) as AppointmentRow[];
  
  if (!modules.has_appointments) {
    return (
      <>
        <Stack.Screen options={{ title: 'Citas' }} />
        <View style={s.empty}>
          <Ionicons name="calendar-outline" size={64} color={colors.text.muted} />
          <Text style={s.emptyTitle}>Módulo no disponible</Text>
          <Text style={s.emptyDesc}>
            Contacta al administrador para activar el módulo de citas.
          </Text>
        </View>
      </>
    );
  }

  const weekDays = useMemo(() => {
    const days = [];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [today]);

  return (
    <>
      <Stack.Screen options={{ title: 'Citas' }} />
      <ScrollView style={s.container}>
        <Text style={s.header}>Citas de Hoy</Text>
        <Text style={s.dateHeader}>
          {today.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        
        {/* Week Calendar */}
        <View style={s.weekRow}>
          {weekDays.map((day, idx) => (
            <Pressable
              key={idx}
              style={[s.dayButton, day.toDateString() === today.toDateString() && s.dayButtonActive]}
            >
              <Text style={[s.dayText, day.toDateString() === today.toDateString() && s.dayTextActive]}>
                {day.toLocaleDateString('es-PE', { weekday: 'short' }).slice(0, 2)}
              </Text>
              <Text style={[s.dayNum, day.toDateString() === today.toDateString() && s.dayNumActive]}>
                {day.getDate()}
              </Text>
            </Pressable>
          ))}
        </View>
        
        {/* Appointments List */}
        <View style={s.appointmentsList}>
          {(appointments ?? []).map((apt) => {
            const timeStr = new Date(apt.start_time).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
            return (
            <Pressable key={apt.id} style={s.appointmentCard}>
              <View style={s.appointmentTime}>
                <Text style={s.appointmentTimeText}>{timeStr}</Text>
              </View>
              <View style={s.appointmentInfo}>
                <Text style={s.appointmentCustomer}>{apt.customer_name}</Text>
                <View style={s.appointmentService}>
                  <Ionicons name="cut-outline" size={12} color={colors.text.muted} />
                  <Text style={s.appointmentServiceText}>{apt.item_id}</Text>
                </View>
              </View>
              <View style={s.appointmentStatus}>
                <Text style={s.appointmentStatusText}>{STATUS_LABELS[apt.status]}</Text>
              </View>
            </Pressable>
            );
          })}
        </View>
        
        {/* Actions */}
        <Pressable style={s.addButton}>
          <Ionicons name="add" size={20} color={colors.bg.base} />
          <Text style={s.addButtonText}>Nueva Cita</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base, padding: spacing[4] },
  header: { fontSize: 20, fontWeight: typography.weight.bold, color: colors.text.primary },
  dateHeader: { fontSize: 14, color: colors.text.muted, marginTop: spacing[1], marginBottom: spacing[4] },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[4] },
  dayButton: { alignItems: 'center', padding: spacing[2], borderRadius: radius.md },
  dayButtonActive: { backgroundColor: colors.accent.green },
  dayText: { fontSize: 12, color: colors.text.muted },
  dayTextActive: { color: colors.bg.base },
  dayNum: { fontSize: 16, fontWeight: typography.weight.bold, color: colors.text.primary },
  dayNumActive: { color: colors.bg.base },
  appointmentsList: { gap: spacing[2] },
  appointmentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.surface, borderRadius: radius.lg, padding: spacing[3] },
  appointmentTime: { marginRight: spacing[3] },
  appointmentTimeText: { fontSize: 14, fontWeight: typography.weight.bold, color: colors.text.primary },
  appointmentInfo: { flex: 1 },
  appointmentCustomer: { fontSize: 14, fontWeight: typography.weight.medium, color: colors.text.primary },
  appointmentService: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], marginTop: 2 },
  appointmentServiceText: { fontSize: 12, color: colors.text.muted },
  appointmentStatus: {},
  appointmentStatusText: { fontSize: 11, color: colors.accent.amber, fontWeight: typography.weight.bold, textTransform: 'uppercase' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], backgroundColor: colors.accent.green, borderRadius: radius.md, padding: spacing[3], marginTop: spacing[4] },
  addButtonText: { fontSize: 14, fontWeight: typography.weight.bold, color: colors.bg.base },
  empty: { flex: 1, backgroundColor: colors.bg.base, alignItems: 'center', justifyContent: 'center', padding: spacing[8] },
  emptyTitle: { fontSize: 18, fontWeight: typography.weight.bold, color: colors.text.primary, marginTop: spacing[4] },
  emptyDesc: { fontSize: 14, color: colors.text.muted, textAlign: 'center', marginTop: spacing[2] },
});