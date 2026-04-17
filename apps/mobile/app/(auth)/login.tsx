/**
 * Login Screen
 *
 * Design: Supabase auth UI — dark centered card, emerald CTA.
 * Connects to Supabase Auth (email/password).
 * On success, AppProvider + AuthGuard redirects to /(tabs).
 */
import {
  View, Text, TextInput, Pressable,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Keyboard,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase/client';

type Field = 'email' | 'password';

// [AUTH-004] Exponential backoff helper
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export default function LoginScreen() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [focused,  setFocused]  = useState<Field | null>(null);
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
        setError('Credenciales inválidas. Verifica tu email y contraseña.');
      }
    } else {
      setFailedAttempts(0);
      setLockoutDate(null);
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

  const inputStyle = (field: Field) => [
    s.input,
    focused === field && s.inputFocused,
    error && s.inputError,
  ];

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
          <View style={[s.errorBox, { backgroundColor: '#0d2b1e', borderColor: '#3ECF8E40' }]}>
            <Text style={[s.errorText, { color: '#3ECF8E' }]}>{resetMessage}</Text>
          </View>
        )}

        {/* Email */}
        <View style={s.fieldGroup}>
          <Text style={s.label}>Email</Text>
          <TextInput
            style={inputStyle('email')}
            placeholder="cajero@negocio.com"
            placeholderTextColor="#3a3a3a"
            value={email}
            onChangeText={(txt) => { setEmail(txt); setError(null); setResetMessage(null); }}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType={isResetMode ? "done" : "next"}
          />
        </View>

        {/* Password (only in login mode) */}
        {!isResetMode && (
          <View style={s.fieldGroup}>
            <Text style={s.label}>Contraseña</Text>
            <View style={[inputStyle('password'), { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 8 }]}>
              <TextInput
                style={{ flex: 1, color: '#ededed', fontSize: 14, height: '100%' }}
                placeholder="••••••••"
                placeholderTextColor="#3a3a3a"
                value={password}
                onChangeText={(txt) => { setPassword(txt); setError(null); }}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable hitSlop={10} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9b9b9b" />
              </Pressable>
            </View>
            <Text style={s.helperText}>Mínimo 8 caracteres</Text>
          </View>
        )}

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [
            s.btn,
            pressed && s.btnPressed,
            loading && s.btnDisabled,
          ]}
          onPress={isResetMode ? handleResetPassword : handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0f0f0f" />
          ) : (
            <Text style={s.btnText}>{isResetMode ? 'Recibir enlace' : 'Ingresar'}</Text>
          )}
        </Pressable>

        {/* Footer actions */}
        <View style={{ gap: 12 }}>
          <Pressable onPress={() => { setIsResetMode(!isResetMode); setError(null); setResetMessage(null); }}>
            <Text style={[s.footer, { color: '#3ECF8E', fontWeight: '500' }]}>
              {isResetMode ? '← Volver al login' : '¿Olvidaste tu contraseña?'}
            </Text>
          </Pressable>
          
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text style={s.footer}>
              ¿No tienes cuenta? <Text style={{ color: '#ededed', fontWeight: 'bold' }}>Crear cuenta</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#272727',
    padding: 28,
  },

  // Logo
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#3ECF8E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { fontSize: 16, fontWeight: '800', color: '#0f0f0f' },
  logoText:   { fontSize: 16, fontWeight: '700', color: '#ededed', letterSpacing: -0.3 },

  // Header
  title:    { fontSize: 20, fontWeight: '700', color: '#ededed', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 24 },

  // Error
  errorBox: {
    backgroundColor: '#2b0d0d',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF444440',
    padding: 12,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, color: '#EF4444' },

  // Form
  fieldGroup:   { marginBottom: 16 },
  label:        { fontSize: 12, fontWeight: '500', color: '#9b9b9b', marginBottom: 6, letterSpacing: 0.3 },
  input: {
    height: 42,
    backgroundColor: '#0f0f0f',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#272727',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#ededed',
  },
  inputFocused: { borderColor: '#3ECF8E' },
  inputError:   { borderColor: '#EF444460' },
  helperText:   { fontSize: 11, color: '#555', marginTop: 6 },

  // Button
  btn: {
    height: 44,
    backgroundColor: '#3ECF8E',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  btnPressed:  { backgroundColor: '#2EBF7E' },
  btnDisabled: { opacity: 0.7 },
  btnText:     { fontSize: 15, fontWeight: '700', color: '#0f0f0f' },

  footer: { fontSize: 12, color: '#444', textAlign: 'center', lineHeight: 18 },
});
