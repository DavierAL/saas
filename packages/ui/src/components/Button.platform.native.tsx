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
  children,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const buttonLabel = accessibilityLabel || label || (typeof children === 'string' ? children : undefined);

  const getStyles = (pressed: boolean) => {
    const base: ViewStyle = {
      ...s.btn,
      ...s[size as keyof typeof s] as ViewStyle,
      ...variantStyles[variant].btn as ViewStyle,
    };

    if (pressed) {
      return [{ ...base, ...variantStyles[variant].pressed } as ViewStyle, style];
    }
    if (isDisabled) {
      return [{ ...base, opacity: 0.5 } as ViewStyle, style];
    }
    return [base, style];
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => getStyles(pressed)}
      accessibilityRole="button"
      accessibilityLabel={buttonLabel}
      accessibilityState={{ disabled: isDisabled }}
      accessibilityElementsHidden={loading}
      importantForAccessibility={loading ? 'no-hide-descendants' : 'auto'}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? colors.bg.base : colors.accent.green} 
          size="small"
          accessibilityLabel="Cargando"
        />
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
  outline: {
    btn:     { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border.default },
    pressed: { backgroundColor: colors.bg.surface },
    text:    { color: colors.text.primary },
  },
};
