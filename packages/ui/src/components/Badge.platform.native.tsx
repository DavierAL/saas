import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../tokens';
import { BadgeProps } from './types';

export function Badge({ label, variant = 'info', dim = true }: BadgeProps) {
  const styles = getVariantStyles(variant, dim);
  
  return (
    <View style={[s.badge, styles.container]}>
      <Text style={[s.text, styles.text]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

function getVariantStyles(variant: string, dim: boolean) {
  switch (variant) {
    case 'success':
      return {
        container: { backgroundColor: dim ? colors.accent.greenDim : colors.accent.green, borderWidth: 1, borderColor: colors.accent.greenBorder },
        text:      { color: colors.accent.green },
      };
    case 'warning':
      return {
        container: { backgroundColor: dim ? colors.accent.amberDim : colors.accent.amber, borderWidth: 1, borderColor: colors.accent.amber },
        text:      { color: colors.accent.amber },
      };
    case 'error':
      return {
        container: { backgroundColor: dim ? colors.accent.redDim : colors.accent.red, borderWidth: 1, borderColor: colors.accent.red },
        text:      { color: colors.accent.red },
      };
    default:
      return {
        container: { backgroundColor: dim ? colors.accent.indigoDim : colors.accent.indigo, borderWidth: 1, borderColor: colors.accent.indigoBorder },
        text:      { color: colors.accent.indigo },
      };
  }
}
