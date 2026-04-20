import { ReactNode } from 'react';

// ─── Button Types ──────────────────────────────────────────────
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label?: string;
  children?: ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: any;
}

// ─── Badge Types ───────────────────────────────────────────────
export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  dim?: boolean;
}

// ─── StatusDot Types ───────────────────────────────────────────
export interface StatusDotProps {
  status: 'online' | 'offline' | 'connecting' | 'error';
  size?: number;
}

// ─── Input Types ───────────────────────────────────────────────
export interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string | null;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  helperText?: string;
}
