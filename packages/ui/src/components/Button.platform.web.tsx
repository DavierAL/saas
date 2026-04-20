import React from 'react';
import { colors, spacing, radius, typography } from '../tokens';
import { ButtonProps } from './types';

/**
 * Web implementation of Button using standard HTML primitives.
 */
export function Button({ 
  label, 
  onPress, 
  variant = 'primary', 
  size = 'md', 
  disabled, 
  loading, 
  children 
}: ButtonProps) {
  
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.md,
    cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
    transition: 'all 150ms ease',
    border: 'none',
    outline: 'none',
    opacity: (disabled || loading) ? 0.6 : 1,
    padding: `${spacing[2]}px ${spacing[4]}px`,
    height: size === 'sm' ? 32 : size === 'lg' ? 52 : 44,
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: colors.accent.green,
      color: colors.bg.base,
    },
    secondary: {
      backgroundColor: colors.bg.surface,
      color: colors.text.primary,
      border: `1px solid ${colors.border.default}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.accent.green,
    },
    danger: {
      backgroundColor: colors.accent.redDim,
      color: colors.accent.red,
      border: `1px solid ${colors.accent.red}`,
    },
  };

  return (
    <button 
      onClick={onPress} 
      disabled={disabled || loading}
      style={{ ...baseStyle, ...variantStyles[variant] }}
    >
      {loading ? '...' : (label || children)}
    </button>
  );
}
