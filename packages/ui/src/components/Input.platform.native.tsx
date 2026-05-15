import { useState, useId } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../tokens';
import { InputProps } from './types';

export function Input({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  error, 
  secureTextEntry, 
  keyboardType = 'default',
  autoCapitalize = 'none',
  helperText,
  accessibilityLabel,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = useId();
  const labelId = `${inputId}-label`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  
  const computedAccessibilityLabel = accessibilityLabel || label;
  const hasError = !!error;

  return (
    <View style={s.container}>
      {label && (
        <Text style={s.label} id={labelId}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          s.input,
          isFocused && s.inputFocused,
          error && s.inputError
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityLabel={hasError ? `${computedAccessibilityLabel}, error: ${error}` : computedAccessibilityLabel}
        accessibilityHint={helperText ?? undefined}
      />
      {error ? (
        <Text style={s.errorText} id={errorId} accessibilityRole="alert">
          {error}
        </Text>
      ) : helperText ? (
        <Text style={s.helperText} id={helperId}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
    width: '100%',
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing[1.5],
    letterSpacing: typography.tracking.wide,
  },
  input: {
    height: 44,
    backgroundColor: colors.bg.base,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing[3],
    fontSize: typography.size.md,
    color: colors.text.primary,
  },
  inputFocused: {
    borderColor: colors.accent.green,
  },
  inputError: {
    borderColor: colors.accent.red,
  },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.accent.red,
    marginTop: spacing[1.5],
  },
  helperText: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    marginTop: spacing[1.5],
  },
});
