import React, { useState } from 'react';
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
  helperText 
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const containerStyle: React.CSSProperties = {
    marginBottom: `${spacing[4]}px`,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: `${typography.size.sm}px`,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: `${spacing[1.5]}px`,
    letterSpacing: `${typography.tracking.wide}px`,
  };

  const inputStyle: React.CSSProperties = {
    height: '44px',
    backgroundColor: colors.bg.base,
    borderRadius: `${radius.md}px`,
    border: `1px solid ${error ? colors.accent.red : isFocused ? colors.accent.green : colors.border.default}`,
    padding: `0 ${spacing[3]}px`,
    fontSize: `${typography.size.md}px`,
    color: colors.text.primary,
    outline: 'none',
    transition: 'border-color 150ms ease',
  };

  const errorTextStyle: React.CSSProperties = {
    fontSize: `${typography.size.sm}px`,
    color: colors.accent.red,
    marginTop: `${spacing[1.5]}px`,
  };

  const helperTextStyle: React.CSSProperties = {
    fontSize: `${typography.size.xs}px`,
    color: colors.text.muted,
    marginTop: `${spacing[1.5]}px`,
  };

  return (
    <div style={containerStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <input
        style={inputStyle}
        value={value}
        onChange={(e) => onChangeText((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        type={secureTextEntry ? 'password' : keyboardType === 'email-address' ? 'email' : 'text'}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {error ? (
        <span style={errorTextStyle}>{error}</span>
      ) : helperText ? (
        <span style={helperTextStyle}>{helperText}</span>
      ) : null}
    </div>
  );
}
