import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, radius, typography } from '../tokens';
import { ButtonProps } from './types';

export function Button({ 
  label, 
  onPress, 
  variant = 'primary', 
  size = 'md', 
  disabled, 
  loading, 
  children 
}: ButtonProps) {
  
  const getStyles = (pressed: boolean) => {
    const base: ViewStyle = {
      ...s.btn,
      ...s[size as keyof typeof s] as ViewStyle,
      ...variantStyles[variant].btn as ViewStyle,
    };

    if (pressed) {
      return { ...base, ...variantStyles[variant].pressed } as ViewStyle;
    }
    if (disabled || loading) {
      return { ...base, opacity: 0.5 } as ViewStyle;
    }
    return base;
  };

  return (
    <Pressable 
      onPress={onPress} 
      disabled={disabled || loading}
      style={({ pressed }) => getStyles(pressed)}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.bg.base : colors.accent.green} />
      ) : (
        <Text style={[s.text, variantStyles[variant].text as TextStyle]}>
          {label || children}
        </Text>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sm: { height: 32, paddingHorizontal: spacing[3] },
  md: { height: 44, paddingHorizontal: spacing[4] },
  lg: { height: 52, paddingHorizontal: spacing[6] },
  text: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
});

const variantStyles = {
  primary: {
    btn:     { backgroundColor: colors.accent.green },
    pressed: { backgroundColor: '#2EBF7E' }, // Approximate dimming
    text:    { color: colors.bg.base },
  },
  secondary: {
    btn:     { backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.border.default },
    pressed: { backgroundColor: colors.bg.elevated },
    text:    { color: colors.text.primary },
  },
  ghost: {
    btn:     { backgroundColor: 'transparent' },
    pressed: { backgroundColor: colors.bg.surface },
    text:    { color: colors.accent.green },
  },
  danger: {
    btn:     { backgroundColor: colors.accent.redDim, borderWidth: 1, borderColor: colors.accent.red },
    pressed: { backgroundColor: colors.accent.red },
    text:    { color: colors.accent.red },
  },
};
