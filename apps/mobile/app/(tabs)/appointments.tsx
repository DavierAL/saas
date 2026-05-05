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
import { colors, spacing, typography, radius } from '@saas-pos/ui';
import { useModulesConfig } from '../../src/hooks/useModulesConfig';

// Mock data
const MOCK_APPOINTMENTS = [
  { id: '1', customer_name: 'Juan Pérez', time: '09:00', status: 'scheduled', service: 'Corte' },
  { id: '2', customer_name: 'María García', time: '10:00', status: 'scheduled', service: 'Barba' },
  { id: '3', customer_name: 'Carlos López', time: '11:30', status: 'scheduled', service: 'Corte + Barba' },
];

const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

export default function AppointmentsScreen() {
  const modules = useModulesConfig();
  
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

  const today = new Date();
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
          {MOCK_APPOINTMENTS.map((apt) => (
            <Pressable key={apt.id} style={s.appointmentCard}>
              <View style={s.appointmentTime}>
                <Text style={s.appointmentTimeText}>{apt.time}</Text>
              </View>
              <View style={s.appointmentInfo}>
                <Text style={s.appointmentCustomer}>{apt.customer_name}</Text>
                <View style={s.appointmentService}>
                  <Ionicons name="cut-outline" size={12} color={colors.text.muted} />
                  <Text style={s.appointmentServiceText}>{apt.service}</Text>
                </View>
              </View>
              <View style={s.appointmentStatus}>
                <Text style={s.appointmentStatusText}>Programada</Text>
              </View>
            </Pressable>
          ))}
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