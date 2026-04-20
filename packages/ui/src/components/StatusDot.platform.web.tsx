import React from 'react';
import { colors, radius } from '../tokens';
import { StatusDotProps } from './types';

export function StatusDot({ status, size = 8 }: StatusDotProps) {
  const color = getStatusColor(status);
  
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius.full,
    backgroundColor: color,
    display: 'inline-block',
    marginRight: '6px',
  };

  return <span style={style} />;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'online':     return colors.status.success;
    case 'offline':    return colors.text.muted;
    case 'connecting': return colors.status.warning;
    case 'error':      return colors.status.error;
    default:           return colors.text.muted;
  }
}
