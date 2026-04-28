import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (authError) {
      setError('Correo o contraseña incorrectos');
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={s.logoRow}>
          <div style={s.logoMark}>P</div>
          <span style={s.logoText}>SaaS POS</span>
        </div>
        <h1 style={s.title}>Iniciar sesión</h1>
        <p style={s.subtitle}>Accede a tu punto de venta</p>

        {error && (
          <div style={s.errorBox}>
            <span style={s.errorText}>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={s.form}>
          <div style={s.inputGroup}>
            <label style={s.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="cajero@negocio.com"
              style={s.input}
              required
            />
          </div>

          <div style={s.inputGroup}>
            <label style={s.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              style={s.input}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={s.button}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div style={s.footer}>
          <span style={s.footerText}>¿No tienes cuenta? </span>
          <button 
            onClick={() => navigate('/register')} 
            style={s.linkButton}
          >
            Crear cuenta
          </button>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100vw',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-app)',
    color: 'var(--text-primary)',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '24px',
  },
  logoMark: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'var(--accent-color)',
    color: '#0f0f0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '16px',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '-0.3px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    margin: '0 0 24px 0',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '20px',
  },
  errorText: {
    color: '#ef4444',
    fontSize: '13px',
    fontWeight: 500,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-app)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
  },
  button: {
    marginTop: '8px',
    padding: '12px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'var(--accent-color)',
    color: '#0f0f0f',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  footer: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px',
    fontSize: '14px',
  },
  footerText: {
    color: 'var(--text-secondary)',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-color)',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    fontSize: '14px',
  },
};
