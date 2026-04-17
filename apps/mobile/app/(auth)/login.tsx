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
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { supabase } from '../../src/lib/supabase/client';

type Field = 'email' | 'password';

export default function LoginScreen() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [focused,  setFocused]  = useState<Field | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Completa todos los campos.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (authError) {
      // Human-readable Spanish errors
      if (authError.message.includes('Invalid login')) {
        setError('Email o contraseña incorrectos.');
      } else if (authError.message.includes('Email not confirmed')) {
        setError('Confirma tu email antes de ingresar.');
      } else {
        setError(authError.message);
      }
    }
    // Success: AppProvider detects new session → AuthGuard redirects to /(tabs)
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

        <Text style={s.title}>Iniciar sesión</Text>
        <Text style={s.subtitle}>Accede a tu punto de venta</Text>

        {/* Error */}
        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
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
            onChangeText={setEmail}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
          />
        </View>

        {/* Password */}
        <View style={s.fieldGroup}>
          <Text style={s.label}>Contraseña</Text>
          <TextInput
            style={inputStyle('password')}
            placeholder="••••••••"
            placeholderTextColor="#3a3a3a"
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocused('password')}
            onBlur={() => setFocused(null)}
            secureTextEntry
            autoComplete="current-password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [
            s.btn,
            pressed && s.btnPressed,
            loading && s.btnDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0f0f0f" />
          ) : (
            <Text style={s.btnText}>Ingresar</Text>
          )}
        </Pressable>

        {/* Footer */}
        <Text style={s.footer}>
          ¿No tienes cuenta? Contacta a tu administrador.
        </Text>
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
