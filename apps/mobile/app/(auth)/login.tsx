/**
 * Login Screen
 *
 * Design: Supabase auth UI — dark centered card, emerald CTA.
 * Connects to Supabase Auth (email/password).
 * On success, AppProvider + AuthGuard redirects to /(tabs).
 */
import {
  View, Text, StyleSheet, KeyboardAvoidingView, 
  Platform, Keyboard, ScrollView, Pressable
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, Button, Input } from '@saas-pos/ui';
import { supabase } from '../../src/lib/supabase/client';

type Field = 'email' | 'password';

// [AUTH-004] Exponential backoff helper
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export default function LoginScreen() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // [AUTH-004] Antiforce states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutDate, setLockoutDate] = useState<number | null>(null);
  
  // [AUTH-005] Recovery flow
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    Keyboard.dismiss();

    // [AUTH-004] Block attempts if locked out
    if (lockoutDate && Date.now() < lockoutDate) {
      const mins = Math.ceil((lockoutDate - Date.now()) / 60000);
      setError(`Demasiados intentos. Intenta de nuevo en ${mins} minutos.`);
      return;
    }

    if (!email.trim() || !password) {
      setError('Completa todos los campos.');
      return;
    }

    // [UX-004] Email Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Formato de email inválido.');
      return;
    }

    setLoading(true);
    setError(null);

    // [AUTH-004] Exponential backoff
    if (failedAttempts > 0) {
      await delay(Math.pow(2, failedAttempts - 1) * 1000);
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (authError) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      
      if (nextAttempts >= 5) {
        // Lock user out for 15 minutes locally
        setLockoutDate(Date.now() + 15 * 60000);
        setError('Límite de intentos superado. Cuenta bloqueada por 15 minutos.');
      } else {
        // [AUTH-006] Generic error message (don't leak if email exists or not)
        setError('Correo o contraseña incorrectos');
      }
    } else {
      setFailedAttempts(0);
      setLockoutDate(null);
      router.replace('/(tabs)');
    }
  };

  const handleResetPassword = async () => {
    Keyboard.dismiss();

    if (!email.trim()) {
      setError('Por favor ingresa tu email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Formato de email inválido.');
      return;
    }
    setLoading(true);
    setError(null);
    setResetMessage(null);

    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase()
    );

    setLoading(false);
    if (authError) {
      setError('Ocurrió un error. Verifica tu email y vuelve a intentarlo.');
    } else {
      setResetMessage('Revisa tu bandeja de entrada para restablecer tu contraseña.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.scrollContent}>
        <View style={s.card}>
          {/* Logo */}
          <View style={s.logoRow}>
            <View style={s.logoMark}>
              <Text style={s.logoLetter}>P</Text>
            </View>
            <Text style={s.logoText}>SaaS POS</Text>
          </View>

          <Text style={s.title}>{isResetMode ? 'Recuperar acceso' : 'Iniciar sesión'}</Text>
          <Text style={s.subtitle}>
            {isResetMode ? 'Enviaremos un enlace a tu email' : 'Accede a tu punto de venta'}
          </Text>

          {/* Feedback messages */}
          {error && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}
          
          {resetMessage && (
            <View style={[s.errorBox, { backgroundColor: colors.accent.greenDim, borderColor: colors.accent.greenBorder }]}>
              <Text style={[s.errorText, { color: colors.accent.green }]}>{resetMessage}</Text>
            </View>
          )}

          {/* Email */}
          <Input
            label="Email"
            placeholder="cajero@negocio.com"
            value={email}
            onChangeText={(txt) => { setEmail(txt); setError(null); setResetMessage(null); }}
            keyboardType="email-address"
            error={null}
          />

          {/* Password (only in login mode) */}
          {!isResetMode && (
            <View style={{ position: 'relative' }}>
              <Input
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChangeText={(txt) => { setPassword(txt); setError(null); }}
                secureTextEntry={!showPassword}
                helperText="Mínimo 8 caracteres"
                error={null}
              />
              <Pressable 
                hitSlop={10} 
                onPress={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: 38 }}
              >
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.text.secondary} />
              </Pressable>
            </View>
          )}

          {/* CTA */}
          <Button
            label={isResetMode ? 'Recibir enlace' : 'Ingresar'}
            onPress={isResetMode ? handleResetPassword : handleLogin}
            loading={loading}
            variant="primary"
          />

          {/* Footer actions */}
          <View style={{ gap: spacing[3] }}>
            <Pressable onPress={() => { setIsResetMode(!isResetMode); setError(null); setResetMessage(null); }}>
              <Text style={[s.footer, { color: colors.accent.green, fontWeight: typography.weight.medium }]}>
                {isResetMode ? '← Volver al login' : '¿Olvidaste tu contraseña?'}
              </Text>
            </Pressable>
            
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={s.footer}>
                ¿No tienes cuenta? <Text style={{ color: colors.text.primary, fontWeight: typography.weight.bold }}>Crear cuenta</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[6],
  },

  // Logo
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[6],
    gap: spacing[2.5],
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.accent.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { fontSize: 16, fontWeight: typography.weight.extrabold, color: colors.bg.base },
  logoText:   { fontSize: 16, fontWeight: typography.weight.bold, color: colors.text.primary, letterSpacing: typography.tracking.tight },

  // Header
  title:    { fontSize: 20, fontWeight: typography.weight.bold, color: colors.text.primary, letterSpacing: typography.tracking.tight, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.text.muted, marginBottom: spacing[6] },

  // Error
  errorBox: {
    backgroundColor: colors.accent.redDim,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.accent.red,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  errorText: { fontSize: 13, color: colors.accent.red },

  footer: { fontSize: 12, color: colors.text.muted, textAlign: 'center', lineHeight: 18 },
});
