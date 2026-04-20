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
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    Keyboard.dismiss();

    if (!fullName.trim() || !email.trim() || !password || !invitationCode.trim()) {
      setError('Completa todos los campos obligatorios.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Formato de email inválido.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          invitation_code: invitationCode.trim()
        }
      }
    });

    setLoading(false);

    if (authError) {
      if (authError.message.includes('already registered')) {
         setError('Este email ya está registrado.');
      } else {
         setError('Ocurrió un error al crear la cuenta. Intenta nuevamente.');
      }
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <View style={s.container}>
        <View style={s.card}>
          <View style={s.logoRow}>
            <View style={s.logoMark}>
              <Text style={s.logoLetter}>P</Text>
            </View>
            <Text style={s.logoText}>SaaS POS</Text>
          </View>
          <Text style={s.title}>¡Cuenta Creada!</Text>
          <Text style={s.subtitle}>
            Por favor, revisa tu bandeja de entrada para verificar tu cuenta antes de iniciar sesión.
          </Text>
          <Button label="Volver al login" onPress={() => router.replace('/(auth)/login')} />
        </View>
      </View>
    );
  }

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
          <Text style={s.subtitle}>Únete a tu equipo de trabajo</Text>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Full Name */}
          <Input
            label="Nombre Completo"
            placeholder="Ej. Juan Pérez"
            value={fullName}
            onChangeText={(txt) => { setFullName(txt); setError(null); }}
            autoCapitalize="words"
          />

          {/* Email */}
          <Input
            label="Email"
            placeholder="correo@empresa.com"
            value={email}
            onChangeText={(txt) => { setEmail(txt); setError(null); }}
            keyboardType="email-address"
          />

          {/* Password */}
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

          {/* Invitation Code */}
          <Input
            label="Código de Invitación (Tenant)"
            placeholder="ABC-1234"
            value={invitationCode}
            onChangeText={(txt) => { setInvitationCode(txt); setError(null); }}
            autoCapitalize="characters"
          />

          {/* CTA */}
          <Button
            label="Crear cuenta"
            onPress={handleRegister}
            loading={loading}
          />

          {/* Footer actions */}
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
