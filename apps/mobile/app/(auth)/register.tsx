/**
 * Register Screen
 *
 * Design: Supabase auth UI — dark centered card, emerald CTA.
 * Connects to Supabase Auth for new account creation.
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

type Field = 'fullName' | 'email' | 'password' | 'invitationCode';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    if (!email.trim() || !password || !confirmPassword) {
      return 'Completa todos los campos.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Correo electrónico inválido.';
    }
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (password !== confirmPassword) {
      return 'Las contraseñas no coinciden.';
    }
    return null;
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already registered')) {
        setError('Ya existe una cuenta con ese correo.');
      } else {
        setError(signUpError.message);
      }
    } else {
      router.replace('/onboarding');
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <View style={s.logoRow}>
            <View style={s.logoMark}>
              <Text style={s.logoLetter}>P</Text>
            </View>
            <Text style={s.logoText}>SaaS POS</Text>
          </View>

          <Text style={s.title}>Crea tu cuenta</Text>
          <Text style={s.subtitle}>Empieza a gestionar tu negocio hoy</Text>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Email"
            placeholder="correo@empresa.com"
            value={email}
            onChangeText={(txt) => { setEmail(txt); setError(null); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={{ position: 'relative' }}>
            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={(txt) => { setPassword(txt); setError(null); }}
              secureTextEntry={!showPassword}
              helperText="Mínimo 8 caracteres"
            />
            <Pressable 
              hitSlop={10} 
              onPress={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 12, top: 38 }}
            >
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.text.secondary} />
            </Pressable>
          </View>

          <Input
            label="Confirmar Contraseña"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={(txt) => { setConfirmPassword(txt); setError(null); }}
            secureTextEntry={!showPassword}
          />

          <Button
            label="Crear cuenta"
            onPress={handleRegister}
            loading={loading}
          />

          <View style={{ gap: spacing[3], marginTop: spacing[2] }}>
            <Pressable onPress={() => router.back()}>
              <Text style={s.footer}>
                ¿Ya tienes una cuenta? <Text style={{ color: colors.text.primary, fontWeight: typography.weight.bold }}>Iniciar sesión</Text>
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
