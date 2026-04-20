import { View, StyleSheet } from 'react-native';
import { colors, radius } from '../tokens';
import { StatusDotProps } from './types';

export function StatusDot({ status, size = 8 }: StatusDotProps) {
  const color = getStatusColor(status);
  
  return (
    <View style={[
      s.dot, 
      { width: size, height: size, borderRadius: radius.full, backgroundColor: color }
    ]} />
  );
}

const s = StyleSheet.create({
  dot: {
    marginRight: 6,
  },
});

function getStatusColor(status: string) {
  switch (status) {
    case 'online':     return colors.status.success;
    case 'offline':    return colors.text.muted;
    case 'connecting': return colors.status.warning;
    case 'error':      return colors.status.error;
    default:           return colors.text.muted;
  }
}
