import React from 'react';
import { colors, spacing, radius, typography } from '../tokens';
import { BadgeProps } from './types';

export function Badge({ label, variant = 'info', dim = true }: BadgeProps) {
  const vStyles = getVariantStyles(variant, dim);
  
  const containerStyle: React.CSSProperties = {
    padding: `${spacing[0.5]}px ${spacing[2]}px`,
    borderRadius: radius.sm,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    border: '1px solid transparent',
    ...vStyles.container,
  };

  const textStyle: React.CSSProperties = {
    ...vStyles.text,
  };

  return (
    <span style={containerStyle}>
      <span style={textStyle}>{label}</span>
    </span>
  );
}

function getVariantStyles(variant: string, dim: boolean) {
  switch (variant) {
    case 'success':
      return {
        container: { backgroundColor: dim ? colors.accent.greenDim : colors.accent.green, borderColor: colors.accent.greenBorder },
        text:      { color: colors.accent.green },
      };
    case 'warning':
      return {
        container: { backgroundColor: dim ? colors.accent.amberDim : colors.accent.amber, borderColor: colors.accent.amber },
        text:      { color: colors.accent.amber },
      };
    case 'error':
      return {
        container: { backgroundColor: dim ? colors.accent.redDim : colors.accent.red, borderColor: colors.accent.red },
        text:      { color: colors.accent.red },
      };
    default:
      return {
        container: { backgroundColor: dim ? colors.accent.indigoDim : colors.accent.indigo, borderColor: colors.accent.indigoBorder },
        text:      { color: colors.accent.indigo },
      };
  }
}
