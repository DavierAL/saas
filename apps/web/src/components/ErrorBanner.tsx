import type { CSSProperties } from 'react';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

const styles: Record<string, CSSProperties> = {
  banner: {
    backgroundColor: 'var(--error-bg)',
    border: '1px solid var(--error-border)',
    borderRadius: 8,
    padding: '12px 16px',
    marginBottom: 20,
    color: 'var(--error-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 14,
  },
  dismissBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--error-color)',
    cursor: 'pointer',
    fontSize: 16,
    opacity: 0.7,
    padding: '0 4px',
  },
};

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div style={styles.banner}>
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} style={styles.dismissBtn} aria-label="Cerrar">
          ✕
        </button>
      )}
    </div>
  );
}
