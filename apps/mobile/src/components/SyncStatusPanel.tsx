/**
 * SyncStatusPanel — Expandable panel showing detailed sync information.
 * 
 * Shows: status, last sync time, pending changes count.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { colors, spacing, typography, radius } from '@saas-pos/ui';

export function SyncStatusPanel() {
  const syncState = useSyncStatus();
  const [expanded, setExpanded] = useState(false);
  
  const getStatusText = () => {
    switch (syncState.status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Sincronizando...';
      case 'disconnected': return 'Sin conexión';
      case 'error': return 'Error';
      default: return 'Desconocido';
    }
  };
  
  const getStatusColor = () => {
    switch (syncState.status) {
      case 'connected': return colors.status.success;
      case 'connecting': return colors.accent.amber;
      case 'disconnected': return colors.text.muted;
      case 'error': return colors.accent.red;
      default: return colors.text.muted;
    }
  };
  
  const formatLastSync = () => {
    if (!syncState.lastSyncedAt) return 'Nunca';
    
    const lastSync = new Date(syncState.lastSyncedAt);
    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    
    return lastSync.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Pressable 
      style={s.container}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={s.statusRow}>
        <View style={[s.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={s.statusText}>{getStatusText()}</Text>
        {syncState.hasSynced && (
          <Text style={s.syncIndicator}>✓</Text>
        )}
      </View>
      
      {expanded && (
        <View style={s.expandedContent}>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Última sincronización</Text>
            <Text style={s.detailValue}>{formatLastSync()}</Text>
          </View>
          
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Sincronizado</Text>
            <Text style={s.detailValue}>
              {syncState.hasSynced ? 'Sí' : 'No'}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  statusText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
  syncIndicator: {
    fontSize: typography.size.sm,
    color: colors.status.success,
    marginLeft: spacing[1],
  },
  expandedContent: {
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  detailLabel: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
  },
  detailValue: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
});